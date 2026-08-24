import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * The one Supabase client in this codebase built with the secret key -
 * bypasses Row Level Security entirely, so it must never be constructed
 * anywhere in an ordinary request's path. Legitimate callers:
 * `@/lib/commerce-provisioning` (granting/revoking a planner entitlement,
 * only ever after a verified payment - see that file's own comment) and
 * `@/lib/orders.ts` (every order status transition - `orders`' own RLS
 * policy grants a signed-in user read-only access to their own rows and no
 * write access at all, by design, so status changes can only ever happen
 * through this client).
 *
 * Deliberately NOT colocated with `@/lib/supabase/server.ts` or exported
 * from the same barrel pattern - that file's `createSupabaseServerClient`
 * is the one every ordinary Server Component/Action/Route Handler should
 * reach for, always scoped to the calling visitor's own session via
 * cookies. This client has no notion of "the current visitor" at all
 * (no cookies are read here - `security definer` RPC calls don't need a
 * user session, only the secret key's own elevated privilege), which is
 * exactly what makes it dangerous to reach for by habit. A different file,
 * a different function name, and a doc comment this explicit are the
 * friction that's supposed to make "just use this" the wrong instinct.
 *
 * Reads `SUPABASE_SECRET_KEY` directly from `process.env`, never from
 * `@/lib/env`'s `publicEnv` - that module is intentionally importable
 * from Client Components (see its own comment), so a privileged
 * credential can never live there. This file's own `import "server-only"`
 * is what makes it structurally impossible for this module - or the
 * secret key it reads - to end up in a client bundle.
 */
function requireSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. This is expected until a real commerce " +
        "adapter is built - see .env.example and src/lib/commerce-provisioning.ts.",
    );
  }
  return key;
}

/**
 * Constructs a fresh secret-key client per call, matching
 * `createSupabaseServerClient`'s own "never hoist into a module-level
 * constant" discipline - there's no per-request state to leak here (no
 * cookies, no session), but a shared long-lived instance is still the
 * wrong default for a client this privileged.
 */
export function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }

  return createClient<Database>(supabaseUrl, requireSecretKey(), {
    auth: {
      // No session to persist or refresh - this client authenticates as
      // the secret key itself, not as any particular visitor.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

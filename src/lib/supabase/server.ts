import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for the server: Server Components, Server Actions and Route
 * Handlers.
 *
 * The `server-only` import above is the boundary. If this module is ever
 * pulled into a Client Component, the build fails rather than shipping
 * server code - and any privileged credential added here in future is
 * structurally unable to reach the browser.
 *
 * Like the browser client this uses the publishable key, so Row Level
 * Security still applies. Cookies carry the caller's own session, which is
 * what makes server-rendered requests act as the signed-in user rather than
 * as an administrator.
 *
 * A new client is created per request. Never hoist it into a module-level
 * constant: a shared instance would leak one visitor's session into another
 * visitor's render.
 *
 * `createServerClient<Database>` types every `.from(...)` call against
 * the real (hand-written, see `@/types/database`) schema - `.select()`
 * column lists and returned rows are checked against actual columns
 * instead of falling back to a loose/untyped shape.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components render after headers are sent and cannot
            // write cookies. Reads still work; only session writes are
            // dropped here, and they belong in Route Handlers and Server
            // Actions, which can set cookies.
          }
        },
      },
    },
  );
}

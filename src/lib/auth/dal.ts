import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The Data Access Layer for authentication - the actual security boundary,
 * as distinct from `proxy.ts`'s optimistic redirect (see that file's
 * comment). `proxy` only reads a cookie and can be wrong or skipped
 * (prefetches, direct fetches to a Route Handler); nothing in this app
 * should treat "the request reached this code" as proof of identity.
 * Every protected Server Component, Server Action, and Route Handler must
 * call one of these functions itself before touching user data.
 *
 * `supabase.auth.getUser()` - not `getSession()` - is what makes this a
 * secure check rather than an optimistic one: it revalidates the access
 * token against Supabase's Auth server on every call instead of trusting
 * whatever the cookie claims. `cache()` collapses repeated calls within one
 * render pass into a single request, so calling this from a layout AND a
 * page AND a leaf component costs one network round trip, not three.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/**
 * For protected Server Components, Server Actions, and Route Handlers:
 * returns the authenticated user, or redirects to sign-in if there isn't
 * one. `proxy.ts` already redirects unauthenticated `/app/*` requests
 * before they get this far in the common case, but that check runs
 * outside this code path and can be bypassed structurally (a direct
 * Route Handler fetch, a future matcher change) - this is the gate that
 * can't be, and the one every future planner/workspace data function
 * should call before returning anything user-specific.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

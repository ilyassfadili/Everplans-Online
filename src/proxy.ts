import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAppPath, NEXT_PARAM } from "@/config/app";
import { publicEnv } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every navigable request, and
 * performs the *optimistic* half of protecting `/app` (the authenticated
 * customer application): redirect to sign-in if there's no valid session.
 *
 * `supabase.auth.getUser()` does revalidate the token against Supabase's
 * Auth server rather than trusting the cookie blindly, so this check isn't
 * "insecure" - what makes it optimistic is scope, not trust: it verifies
 * *a* session exists, nothing about what that user is specifically
 * allowed to see or do here. Proxy runs on every request, including
 * prefetches, and Next's own guidance is to keep that path free of
 * business/authorization logic - so this stays a single auth call and
 * nothing more. The real, authoritative gate for user-specific data is
 * `requireUser()` in `src/lib/auth/dal.ts`, called from inside `(app)`
 * itself - see that file for why both layers exist.
 *
 * This is also the one place in the app that talks to Supabase via
 * NextRequest/NextResponse cookies directly rather than the `cookies()`
 * API used by `src/lib/supabase/server.ts` - proxy runs before a request
 * is routed to a page or Server Action, where only the request/response
 * pair is available.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Cookies must be written to both the request (so this same
        // proxy invocation's downstream rendering sees the refreshed
        // session) and the response (so the browser actually receives it).
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // The call itself is what triggers a refresh when the access token has
  // expired but a valid refresh token is present.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isAppPath(pathname) && !user) {
    const signInUrl = new URL("/sign-in", request.url);
    // Round-trips the original destination through sign-in so a
    // successful login can return the visitor to what they were trying
    // to reach, instead of dropping them at the generic app home.
    signInUrl.searchParams.set(NEXT_PARAM, `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  // No corresponding "signed in but on a public-only page" bounce here on
  // purpose - each `(auth)` page already does that check itself server-side
  // (see e.g. sign-in/page.tsx), which keeps that redirect visible and
  // easy to find next to the page it affects, instead of proxy growing a
  // second, harder-to-find list of public-only paths for the same decision.

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, image optimization files,
     * and common static file extensions - matches Next's own recommended
     * default pattern for auth-refreshing middleware/proxy.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

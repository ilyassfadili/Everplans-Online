import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every navigable request. Access
 * tokens are short-lived; without this, a signed-in visitor whose token
 * expired between visits would silently appear signed-out on the next
 * server-rendered page even though a valid refresh token exists.
 *
 * This is the one place in the app that talks to Supabase via
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
  // expired but a valid refresh token is present; the result isn't used
  // here, since proxy doesn't gate access to anything yet.
  await supabase.auth.getUser();

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

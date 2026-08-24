/**
 * Canonical facts about the authenticated customer application's route
 * boundary - where it lives, and where to send someone who isn't signed in
 * yet vs. someone who just finished signing in.
 *
 * This is the one place that name is spelled out. `proxy.ts` (route
 * protection), the `(app)` layout (defense in depth), and every auth
 * Server Action/Route Handler's post-success redirect all read from here
 * instead of hardcoding "/app" separately - so the boundary can only ever
 * drift by editing this file.
 */

/** URL prefix for every authenticated customer-application route. */
export const APP_PATH_PREFIX = "/app";

/** Where a signed-in visitor lands with no more specific destination in mind. */
export const APP_HOME_PATH = "/app";

/** Query param name proxy attaches so sign-in can return the user to where they were headed. */
export const NEXT_PARAM = "next";

/** True for any path inside the authenticated application. */
export function isAppPath(pathname: string): boolean {
  return pathname === APP_PATH_PREFIX || pathname.startsWith(`${APP_PATH_PREFIX}/`);
}

/**
 * True only for a same-origin, root-relative path - i.e. safe to pass to
 * `redirect()` as a post-sign-in destination. Rejects absolute URLs
 * ("https://evil.example") and protocol-relative ones ("//evil.example"),
 * either of which would turn an untrusted `next` value into an open
 * redirect. Used by both the sign-in page (an already-authenticated visit)
 * and the sign-in Server Action (a fresh sign-in) - same untrusted input,
 * same rule, checked in one place.
 */
export function isSafeRedirectTarget(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}

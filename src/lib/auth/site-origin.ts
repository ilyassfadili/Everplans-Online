import "server-only";

import { headers } from "next/headers";

/**
 * A Server Action has no request URL to read the way a Route Handler does
 * (`/auth/callback` and `/auth/confirm` just use `new URL(request.url)`) -
 * the `origin` header is what a same-origin form submission actually
 * sends, with a `host`-based fallback for the rare case it's missing.
 * Shared by every auth Server Action that needs to build an absolute
 * redirect/callback URL for Supabase (`forgot-password`, `sign-up`) -
 * originally duplicated between the two, promoted here the moment a second
 * caller needed the exact same logic.
 */
export async function getSiteOrigin(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;

  const host = headersList.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

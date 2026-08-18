/**
 * Typed, validated access to the environment.
 *
 * Every value here is read from a `process.env.NEXT_PUBLIC_*` literal so that
 * Next.js can inline it at build time - dynamic lookups such as
 * `process.env[name]` are silently dropped from the client bundle.
 *
 * Only browser-safe values live in this module. Server-only credentials must
 * be read inside a module marked `import "server-only"`, never here, because
 * anything this file exports can legally be imported by a Client Component.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. ` +
        `Copy .env.example to .env.local and fill it in, or set it in the ` +
        `Vercel project settings for this environment.`,
    );
  }

  return value;
}

/** Values that are safe to expose to the browser. */
export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
} as const;

export type PublicEnv = typeof publicEnv;

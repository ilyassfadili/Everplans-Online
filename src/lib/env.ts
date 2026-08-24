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
  /**
   * PayPal's client id (Everplans Money Prompt 8's checkout SDK) - not a
   * secret. PayPal client ids are designed to ship to browsers, the same
   * way Supabase's publishable key is: it identifies which PayPal app the
   * client-side SDK talks to, but every payment it initiates still must
   * clear this app's own server-side verification
   * (`@/lib/commerce/verify-and-finalize-order.ts`) before anything is
   * trusted. The exact same value also lives server-side as
   * `PAYPAL_CLIENT_ID` (`@/lib/paypal/client.ts`, paired there with the
   * real secret) - two env vars because Next.js only inlines a literal
   * `NEXT_PUBLIC_` name into the browser bundle, never a server-only one.
   */
  paypalClientId: required(
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  ),
} as const;

export type PublicEnv = typeof publicEnv;

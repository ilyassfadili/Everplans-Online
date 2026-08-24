import "server-only";

/**
 * The PayPal REST API adapter's shared plumbing - OAuth2 client-credentials
 * token exchange and the API base URL for whichever environment is
 * configured. Deliberately a thin `fetch` wrapper, not the `@paypal/*` SDK -
 * this codebase adds no new npm dependency for an integration this small
 * (three REST calls: create order, capture order, verify webhook
 * signature). Every other `@/lib/paypal/*` module calls through here rather
 * than duplicating the token exchange or base-URL logic.
 *
 * `server-only`: reads `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` directly
 * from `process.env`, the same "never through `@/lib/env`'s `publicEnv`"
 * discipline `@/lib/supabase/service.ts` documents for `SUPABASE_SECRET_KEY` -
 * a payment-provider secret must never be reachable from a Client
 * Component or the browser bundle.
 */

const PAYPAL_API_BASE: Record<"sandbox" | "live", string> = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

/** Which PayPal environment to call - defaults to `sandbox` on anything other than an explicit `"live"`, so a missing/misconfigured value never accidentally reaches real production PayPal. */
function getPayPalEnvironment(): "sandbox" | "live" {
  return process.env.PAYPAL_ENVIRONMENT === "live" ? "live" : "sandbox";
}

export function getPayPalApiBase(): string {
  return PAYPAL_API_BASE[getPayPalEnvironment()];
}

function requirePayPalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set. Copy .env.example to .env.local and fill them in with " +
        "a PayPal REST app's sandbox (or live) credentials from developer.paypal.com.",
    );
  }

  return { clientId, clientSecret };
}

/** PayPal's `webhookId` isn't a secret (it's used only to look up the expected webhook, never to authenticate) but is still configuration, not code - required once the webhook route (`@/lib/paypal/webhooks.ts`) actually verifies a signature. */
export function requirePayPalWebhookId(): string {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error(
      "PAYPAL_WEBHOOK_ID is not set. Create a webhook for this app in the PayPal developer dashboard and copy its id " +
        "into .env.local - see .env.example.",
    );
  }
  return webhookId;
}

// A client-credentials token is an app-level credential, not tied to any
// one visitor's session - caching it in module scope for its own lifetime
// (minus a safety margin) avoids one extra PayPal round trip per checkout
// step without ever holding onto anything user-specific. This is a
// different situation from `createSupabaseServerClient`'s own "never hoist
// into a module-level constant" rule, which exists specifically to avoid
// leaking one visitor's cookies into another's request.
let cachedToken: { accessToken: string; expiresAtMs: number } | null = null;

async function requestAccessToken(): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const { clientId, clientSecret } = requirePayPalCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`PayPal OAuth token request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
}

const TOKEN_REFRESH_MARGIN_MS = 60_000;

/** Returns a valid PayPal access token, reusing the cached one until it's within a minute of expiring. */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - TOKEN_REFRESH_MARGIN_MS > now) {
    return cachedToken.accessToken;
  }

  const { accessToken, expiresInSeconds } = await requestAccessToken();
  cachedToken = { accessToken, expiresAtMs: now + expiresInSeconds * 1000 };
  return accessToken;
}

/** Thrown for any non-2xx PayPal API response - callers decide how to translate this into a customer-facing message; nothing here exposes the raw PayPal body to a customer. */
export class PayPalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "PayPalApiError";
  }
}

/** A thin, authenticated `fetch` wrapper every `@/lib/paypal/*` call goes through - attaches the bearer token, and turns a non-2xx response into a `PayPalApiError` instead of letting callers each re-check `response.ok`. */
export async function payPalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${getPayPalApiBase()}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    console.error("payPalFetch: PayPal API error", { path, status: response.status, body });
    throw new PayPalApiError(`PayPal API request to ${path} failed`, response.status, body);
  }

  return body as T;
}

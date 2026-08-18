import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

/**
 * Supabase client for the browser.
 *
 * Import this from Client Components only. It is built with the publishable
 * key, so every request it makes is subject to Row Level Security - it can
 * never read or write more than the policies allow.
 *
 * Call it per component rather than exporting a shared instance; the
 * underlying client is already a singleton per browser session.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
  );
}

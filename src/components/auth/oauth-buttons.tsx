"use client";

import { useState } from "react";

import { Button, Text } from "@/components/ui";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Google's own multi-color "G" mark - the standard "Continue with Google" icon. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.54 5.54 0 0 1-2.4 3.63v3.02h3.89c2.28-2.1 3.56-5.2 3.56-8.83Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28a7.2 7.2 0 0 1 0-4.6V6.57H1.27a12 12 0 0 0 0 10.82l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.27 6.57l4.01 3.11C6.22 6.84 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * "Continue with Google" - the one social option, by design (a second
 * GitHub button was cut in the move to a minimal single-card layout; add
 * it back the same way this one works if it's ever wanted again).
 *
 * Genuinely wired to Supabase's real OAuth flow (`signInWithOAuth`), not a
 * decorative button that does nothing. OAuth has to start from the browser
 * (it navigates the whole page to Google's consent screen and back), so
 * this one Client Component calling `auth.*` directly is the deliberate
 * exception to "never a client-side auth.* call" - email/password stays on
 * Server Actions exactly as before. The actual session is still created
 * server-side, in `/auth/callback`'s route handler, through the same
 * server client's cookie handling as everything else.
 *
 * Whether a click actually reaches Google depends on that provider being
 * enabled in the Supabase project's Auth settings - the same "code is real,
 * backend configuration is pending" situation as the contact form's
 * migration. Until then, Supabase returns a real error, which surfaces
 * below rather than a button that silently hangs.
 */
export function OAuthButtons() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // Success navigates away to Google immediately; only a failure ever
    // reaches this line.
    if (oauthError) {
      setLoading(false);
      setError(getAuthErrorMessage(oauthError.message));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={loading}
        onClick={handleGoogleSignIn}
        leadingIcon={<GoogleIcon />}
      >
        Continue with Google
      </Button>

      {error && (
        <Text size="body-sm" tone="error" role="alert">
          {error}
        </Text>
      )}
    </div>
  );
}

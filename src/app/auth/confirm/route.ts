import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { APP_HOME_PATH, isSafeRedirectTarget } from "@/config/app";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where a confirmation-email link lands: `/auth/confirm?token_hash=...&type=signup`.
 * A plain Route Handler, not a page - it verifies the token server-side
 * (through the server client, so the resulting session's cookies get set
 * the same correct way every other signed-in request on this site sets
 * them) and redirects on. The counterpart to `/auth/callback` (OAuth's
 * `code` exchange) - email links use a different Supabase mechanism
 * (`verifyOtp` + `token_hash`), so they get their own route rather than
 * overloading one handler with two unrelated verification schemes.
 *
 * Handles both signup confirmation (`type=signup`) and password recovery
 * (`type=recovery`, from `/forgot-password` - see
 * `src/app/(auth)/reset-password/`) without needing to know which: the
 * `type` param round-trips from whichever Supabase email sent the link,
 * and `verifyOtp` and the `next` redirect both work the same way either
 * way. This only fires once the Supabase project's email templates
 * actually link here - see `supabase/email-templates/` for the templates
 * this route expects, and AGENTS.md's Authentication section for the full
 * dashboard checklist.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = searchParams.get("next");
  // Same open-redirect guard as sign-in's `next` handling (config/app.ts) -
  // this `next` is also untrusted query input, and Supabase's email
  // templates control what `next` gets sent here, not this code.
  const next = isSafeRedirectTarget(requestedNext) ? requestedNext : APP_HOME_PATH;

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Expired, already used, or malformed - sign-in already shows a clear,
  // actionable message ("email not confirmed") with a resend option, so
  // that's a more useful landing spot than a bare error page.
  return NextResponse.redirect(`${origin}/sign-in?confirm=error`);
}

"use server";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ResendState {
  status: "idle" | "sent" | "error";
  message?: string;
}

export const resendInitialState: ResendState = { status: "idle" };

/**
 * Shared by both routes: Sign Up's "confirmation-required" screen (the
 * first email may be slow, or land in spam) and Sign In's "email not
 * confirmed" error (the original link may have expired). One action
 * because it's the same Supabase call either way - `resend()` doesn't need
 * to know which page asked.
 *
 * No client-side `auth.*` call needed here, unlike OAuth - `resend()`
 * doesn't redirect the browser anywhere, it's a plain API call, so this
 * stays a normal Server Action like the rest of the site's auth flows.
 */
export async function resendConfirmationEmail(
  _prevState: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return { status: "error", message: "Enter your email above first." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    return { status: "error", message: getAuthErrorMessage(error.message) };
  }

  return { status: "sent", message: "Sent - check your inbox." };
}

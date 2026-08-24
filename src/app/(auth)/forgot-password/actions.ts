"use server";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getSiteOrigin } from "@/lib/auth/site-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { forgotPasswordSchema } from "./schema";

export interface ForgotPasswordState {
  status: "idle" | "sent" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"email", string>>;
}

export const forgotPasswordInitialState: ForgotPasswordState = { status: "idle" };

/**
 * Deliberately returns the same "sent" state whether or not the email
 * belongs to a real account - Supabase's own `resetPasswordForEmail`
 * already behaves this way (it never reports "no such account"), matching
 * the account-enumeration-avoidance this codebase already applies to
 * sign-in's error copy.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    const fieldErrors: ForgotPasswordState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email") fieldErrors[field] ??= issue.message;
    }
    return { status: "error", message: "Check the highlighted field and try again.", fieldErrors };
  }

  const origin = await getSiteOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // /auth/confirm verifies the recovery token server-side (creating the
    // session `updateUser` on /reset-password needs) and hands off here.
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // A rate-limit or network error is worth surfacing; "no such account" is
  // not an error Supabase raises here at all, by design.
  if (error) {
    return { status: "error", message: getAuthErrorMessage(error.message) };
  }

  return {
    status: "sent",
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

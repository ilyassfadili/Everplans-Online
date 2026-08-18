"use server";

import { headers } from "next/headers";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { forgotPasswordSchema } from "./schema";

export interface ForgotPasswordState {
  status: "idle" | "sent" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"email", string>>;
}

export const forgotPasswordInitialState: ForgotPasswordState = { status: "idle" };

/*
  A Server Action has no request URL to read the way a Route Handler does
  (`/auth/callback` and `/auth/confirm` just use `new URL(request.url)`) -
  the `origin` header is what a same-origin form submission actually sends,
  with a `host`-based fallback for the rare case it's missing.
*/
async function getSiteOrigin(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;

  const host = headersList.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

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

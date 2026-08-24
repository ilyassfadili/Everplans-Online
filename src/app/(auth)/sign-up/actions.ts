"use server";

import { redirect } from "next/navigation";

import { APP_HOME_PATH } from "@/config/app";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getSiteOrigin } from "@/lib/auth/site-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { signUpSchema } from "./schema";

export interface SignUpState {
  status: "idle" | "error" | "confirmation-required";
  message?: string;
  fieldErrors?: Partial<Record<"fullName" | "email" | "password", string>>;
  /** Only set alongside "confirmation-required", so the resend button never needs it re-typed. */
  email?: string;
}

export const signUpInitialState: SignUpState = { status: "idle" };

export async function signUp(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: SignUpState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "fullName" || field === "email" || field === "password") {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { status: "error", message: "Check the highlighted fields and try again.", fieldErrors };
  }

  const origin = await getSiteOrigin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Stored in auth.users' metadata under the same `full_name` key
      // Google OAuth sign-ups already populate on their own - no new
      // table, no migration, and every account (either sign-up path)
      // agrees on one place a future profile screen would read a display
      // name from.
      data: { full_name: parsed.data.fullName },
      // Matches `requestPasswordReset`'s own reasoning (`../forgot-password/actions.ts`):
      // the confirmation email's actual link is built from the Supabase
      // project's own "Site URL" setting (see `supabase/email-templates/confirm-signup.html`,
      // which hardcodes `{{ .SiteURL }}/auth/confirm...`), so this
      // `emailRedirectTo` alone can't fix a misconfigured Site URL - it's
      // set anyway for the templates/flows that do read `{{ .RedirectTo }}`,
      // and so this call is never silently different from every other
      // auth action in this codebase that resolves its own origin.
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { status: "error", message: getAuthErrorMessage(error.message) };
  }

  // Supabase's own signal for which flow this project is configured for:
  // a session means the account is active immediately (email confirmation
  // is off, or was already satisfied); no session means confirmation is
  // pending. The UI branches on this rather than assuming either way.
  if (!data.session) {
    return {
      status: "confirmation-required",
      message: "Check your inbox to confirm your email before signing in.",
      email: parsed.data.email,
    };
  }

  redirect(APP_HOME_PATH);
}

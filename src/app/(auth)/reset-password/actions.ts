"use server";

import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { resetPasswordSchema } from "./schema";

export interface ResetPasswordState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"password", string>>;
}

export const resetPasswordInitialState: ResetPasswordState = { status: "idle" };

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) {
    const fieldErrors: ResetPasswordState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "password") fieldErrors[field] ??= issue.message;
    }
    return { status: "error", message: "Check the highlighted field and try again.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  // Only reachable with the session /auth/confirm's recovery-token exchange
  // already created - the page itself redirects away before rendering this
  // form at all if that session isn't present.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: "error", message: getAuthErrorMessage(error.message) };
  }

  // Already signed in via the recovery session - no reason to make someone
  // who just proved their identity through email sign in a second time.
  redirect("/");
}

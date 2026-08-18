"use server";

import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { signInSchema } from "./schema";

export interface SignInState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
  /** Set only for this one error, so the form can offer a resend button instead of a dead end. */
  emailNotConfirmed?: boolean;
  email?: string;
}

export const signInInitialState: SignInState = { status: "idle" };

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: SignInState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") fieldErrors[field] ??= issue.message;
    }
    return { status: "error", message: "Check the highlighted fields and try again.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const emailNotConfirmed = error.message.toLowerCase().includes("email not confirmed");
    return {
      status: "error",
      message: getAuthErrorMessage(error.message),
      emailNotConfirmed,
      email: emailNotConfirmed ? parsed.data.email : undefined,
    };
  }

  // No dashboard or customer workspace exists yet - Home is the only
  // honest redirect target. redirect() throws, so it must stay outside
  // any try/catch (Next.js docs: "redirect should be called outside the
  // try block").
  redirect("/");
}

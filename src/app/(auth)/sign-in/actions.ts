"use server";

import { redirect } from "next/navigation";

import { APP_HOME_PATH, isSafeRedirectTarget } from "@/config/app";
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
  // Round-tripped from proxy.ts's optimistic redirect (see that file) via a
  // hidden field the form includes - `next` is only ever a same-origin
  // app path proxy generated itself, but it's still untrusted client
  // input by the time it reaches here, so it's validated below rather
  // than passed straight to redirect().
  const next = formData.get("next");

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

  // isSafeRedirectTarget guards against `next` turning a successful
  // sign-in into an open redirect (see its own comment in config/app.ts).
  // redirect() throws, so it must stay outside any try/catch (Next.js
  // docs: "redirect should be called outside the try block").
  redirect(isSafeRedirectTarget(next) ? next : APP_HOME_PATH);
}

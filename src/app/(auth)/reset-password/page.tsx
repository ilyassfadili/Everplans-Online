import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: true },
};

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only reachable via a valid recovery link - /auth/confirm creates this
  // session from the emailed token before ever redirecting here. No
  // session means no valid link, so send them back to request a new one
  // rather than showing a form with nothing to submit against.
  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthCard>
  );
}

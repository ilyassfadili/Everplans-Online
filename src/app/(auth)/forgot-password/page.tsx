import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { Link, Text } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: true },
};

export default async function ForgotPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <AuthCard title="Reset your password" subtitle="Enter your email and we’ll send you a link.">
      <ForgotPasswordForm />

      <Text size="body-sm" tone="muted" className="mt-8 text-center">
        Remembered it after all?{" "}
        <Link href="/sign-in" variant="inline">
          Sign in
        </Link>
      </Text>
    </AuthCard>
  );
}

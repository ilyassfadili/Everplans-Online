import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { Link, Text } from "@/components/ui";
import { APP_HOME_PATH } from "@/config/app";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: true },
};

export default async function SignUpPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(APP_HOME_PATH);
  }

  return (
    <AuthCard title="Create your account" subtitle="Get started with Everplans.">
      <SignUpForm />

      <Text size="body-sm" tone="muted" className="mt-8 text-center">
        Already have an account?{" "}
        <Link href="/sign-in" variant="inline">
          Sign in
        </Link>
      </Text>
    </AuthCard>
  );
}

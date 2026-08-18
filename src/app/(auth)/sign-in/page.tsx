import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Link, Text } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: true },
};

export default async function SignInPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in - a sign-in form is a confusing thing to see next.
  if (user) {
    redirect("/");
  }

  return (
    <AuthCard title="Sign in" subtitle="Welcome back to Everplans.">
      <OAuthButtons />

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-line-subtle" />
        <Text size="body-sm" tone="faint">
          or
        </Text>
        <div className="h-px flex-1 bg-line-subtle" />
      </div>

      <SignInForm />

      <Text size="body-sm" tone="muted" className="mt-8 text-center">
        Don’t have an account?{" "}
        <Link href="/sign-up" variant="inline">
          Sign up
        </Link>
      </Text>
    </AuthCard>
  );
}

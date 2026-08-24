import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { OrDivider } from "@/components/auth/or-divider";
import { Alert, Link, Text } from "@/components/ui";
import { APP_HOME_PATH, isSafeRedirectTarget, NEXT_PARAM } from "@/config/app";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: true },
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set by /auth/confirm's catch-all redirect when a confirmation link
  // didn't verify (expired, already used, or malformed) - it deliberately
  // doesn't say which, and neither do we, so this never becomes an
  // account-enumeration or internal-error surface.
  const { confirm, [NEXT_PARAM]: next } = await props.searchParams;
  const confirmFailed = confirm === "error";
  const nextParam = isSafeRedirectTarget(next) ? next : undefined;

  // Already signed in - a sign-in form is a confusing thing to see next.
  // Still honors `next` (e.g. a bookmarked protected link while already
  // signed in) rather than always bouncing to the generic app home.
  if (user) {
    redirect(nextParam ?? APP_HOME_PATH);
  }

  return (
    <AuthCard title="Sign in" subtitle="Welcome back to Everplans.">
      {confirmFailed && (
        <Alert variant="error" title="Couldn't confirm your email" className="mb-6">
          That link may have expired or already been used. Sign in below - if your email
          still needs confirming, we&rsquo;ll give you the option to resend it.
        </Alert>
      )}

      <OAuthButtons />

      <OrDivider />

      <SignInForm next={nextParam} />

      <Text size="body-sm" tone="muted" className="mt-8 text-center">
        Don’t have an account?{" "}
        <Link href="/sign-up" variant="inline">
          Sign up
        </Link>
      </Text>
    </AuthCard>
  );
}

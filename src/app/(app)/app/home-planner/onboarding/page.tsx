import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { resolveHomePlannerAccess } from "@/lib/home-planner/homes";

import { OnboardingForm } from "./_components/onboarding-form";

export const metadata: Metadata = {
  title: "Set Up Your Home",
  robots: { index: false, follow: false },
};

/**
 * Home Planner setup (Everplans Home Planner Prompt 1 Phase 2, gated by
 * real commerce as of Prompt 6) - the one-screen form that creates a
 * user's home workspace. `resolveHomePlannerAccess()` (`@/lib/home-planner/homes`,
 * Prompt 6) is the real gate: `"granted"` (already set up) redirects
 * straight to the dashboard, so this screen can never be revisited to
 * "start over" or accidentally create a second home - `homes_owner_unique`
 * (the migration) is the guarantee this check is only the fast, friendly
 * front for. `"needs-purchase"` (no active entitlement) redirects to
 * `/app/home-planner/checkout` instead of this form - onboarding is the
 * one real gate a non-purchaser can't get past, since every downstream
 * Home Planner page requires a home, and no home can be created without
 * first reaching here. Only `"needs-onboarding"` actually renders the
 * form. `createHomeFormAction` (`./actions.ts`) re-checks entitlement
 * server-side before ever creating a home - this page's own redirect is
 * the fast, friendly front for that real enforcement. Same shape as
 * `travel-planner/onboarding/page.tsx`.
 */
export default async function HomePlannerOnboardingPage() {
  const access = await resolveHomePlannerAccess();

  if (access.status === "granted") {
    redirect("/app/home-planner");
  }
  if (access.status === "needs-purchase") {
    redirect("/app/home-planner/checkout");
  }

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Let&rsquo;s set up your home
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Just a few details to get your workspace ready. You can add your household and
          important contacts right after, and adjust anything here later.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <OnboardingForm />
      </Card>
    </Container>
  );
}

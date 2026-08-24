import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { TravelFlourish } from "@/components/travel/travel-flourish";
import { resolveTravelPlannerAccess } from "@/lib/travel/trips";

import { OnboardingForm } from "./_components/onboarding-form";

export const metadata: Metadata = {
  title: "Set Up Your Trip",
  robots: { index: false, follow: false },
};

/**
 * Travel Planner trip setup (Prompt 1 Phase 3, gated by real commerce as
 * of Prompt 6) - the one-screen form that creates a user's trip workspace.
 * `resolveTravelPlannerAccess()` (`@/lib/travel/trips`, Prompt 6 Phase 1/2)
 * is the real gate: `"granted"` (already set up) redirects straight to the
 * dashboard, so this screen can never be revisited to "start over" or
 * accidentally create a second trip - `trips_owner_unique` (the migration)
 * is the guarantee this check is only the fast, friendly front for.
 * `"needs-purchase"` (no active entitlement) redirects to
 * `/app/travel-planner/checkout` instead of this form - onboarding is the
 * one real gate a non-purchaser can't get past, since every downstream
 * Travel Planner page requires a trip, and no trip can be created without
 * first reaching here. Only `"needs-onboarding"` actually renders the
 * form. `createTripFormAction` (`./actions.ts`) re-checks entitlement
 * server-side before ever creating a trip - this page's own redirect is
 * the fast, friendly front for that real enforcement, never the only
 * thing standing between a bug here and a free workspace. Same shape as
 * `budget-planner/onboarding/page.tsx`.
 */
export default async function TravelPlannerOnboardingPage() {
  const access = await resolveTravelPlannerAccess();

  if (access.status === "granted") {
    redirect("/app/travel-planner");
  }
  if (access.status === "needs-purchase") {
    redirect("/app/travel-planner/checkout");
  }

  return (
    <Container size="narrow" className="relative flex flex-1 flex-col justify-center gap-8 overflow-hidden py-10 md:py-14">
      <TravelFlourish className="pointer-events-none absolute -right-6 top-0 h-28 w-40 text-brand/[0.06]" />
      <div>
        <Eyebrow tone="brand">Travel Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Let&rsquo;s start planning your trip
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Just a few details to get your workspace ready. You can always come back and adjust
          anything from here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <OnboardingForm />
      </Card>
    </Container>
  );
}

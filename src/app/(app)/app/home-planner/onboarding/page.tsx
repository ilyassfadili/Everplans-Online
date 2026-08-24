import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";

import { OnboardingForm } from "./_components/onboarding-form";

export const metadata: Metadata = {
  title: "Set Up Your Home",
  robots: { index: false, follow: false },
};

/**
 * Home Planner setup (Everplans Home Planner Prompt 1 Phase 2) - the
 * one-screen form that creates a user's home workspace. `getHomeForCurrentUser()`
 * also gates the route (it calls `requireUser()` internally): a signed-in
 * visitor with no home yet sees this form; one who's already set up is
 * redirected straight to their workspace, so this screen can never be
 * revisited to "start over" or accidentally create a second home -
 * `homes_owner_unique` (the migration) is the guarantee this check is only
 * the fast, friendly front for. Same shape as `travel-planner/onboarding/page.tsx`.
 */
export default async function HomePlannerOnboardingPage() {
  const home = await getHomeForCurrentUser();

  if (home) {
    redirect("/app/home-planner");
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

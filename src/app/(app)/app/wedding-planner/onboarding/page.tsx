import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { WeddingFlourish } from "@/components/wedding/wedding-flourish";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { OnboardingForm } from "./_components/onboarding-form";

export const metadata: Metadata = {
  title: "Set Up Your Wedding",
  robots: { index: false, follow: false },
};

/**
 * Wedding Planner onboarding (Prompt 1 Phase 3) - the one-screen form that
 * creates a user's wedding workspace. `getWeddingForCurrentUser()` also
 * gates the route (it calls `requireUser()` internally): a signed-in
 * visitor with no workspace yet sees this form; one who's already
 * onboarded is redirected straight to their workspace, so this screen can
 * never be revisited to "start over" or accidentally create a second one -
 * `weddings_owner_unique` (the migration) is the guarantee this check is
 * only the fast, friendly front for.
 */
export default async function WeddingOnboardingPage() {
  const wedding = await getWeddingForCurrentUser();

  if (wedding) {
    redirect("/app/wedding-planner");
  }

  return (
    <Container size="narrow" className="relative flex flex-1 flex-col justify-center gap-8 overflow-hidden py-10 md:py-14">
      <WeddingFlourish className="pointer-events-none absolute -right-6 top-0 h-40 w-28 text-brand/[0.06]" />
      <div>
        <Eyebrow>Wedding Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Let&rsquo;s start planning your day, together
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Just a couple of details to get your workspace ready. You can always come back and build
          out the rest of your plan from here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <OnboardingForm />
      </Card>
    </Container>
  );
}

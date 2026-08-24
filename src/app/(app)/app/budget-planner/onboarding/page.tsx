import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { resolveBudgetPlannerAccess } from "@/lib/budget/plans";

import { OnboardingWizard } from "./_components/onboarding-wizard";

export const metadata: Metadata = {
  title: "Set Up Your Budget",
  robots: { index: false, follow: false },
};

/**
 * Budget Planner onboarding (Prompt 1 Phase 3) - a short, progressive wizard
 * that creates a user's budget plan, gated by `resolveBudgetPlannerAccess()`
 * (Everplans Money Prompt 4's shared, entitlement-authoritative access
 * check - see its own comment): `"granted"` (already onboarded) redirects
 * straight to the workspace, so this screen can never be revisited to
 * "start over" or accidentally create a second plan -
 * `budget_plans_owner_unique` (the migration) is the guarantee this check
 * is only the fast, friendly front for. `"needs-purchase"` (no active
 * entitlement - never purchased, or a prior purchase's entitlement was
 * revoked/refunded) redirects to `/app/budget-planner/checkout` instead of
 * this wizard - onboarding is the one real gate a non-purchaser can't get
 * past, since every downstream Budget Planner page requires a plan, and no
 * plan can be created without first reaching here. Only `"needs-onboarding"`
 * actually renders the wizard. `completeBudgetOnboardingAction`
 * (`./actions.ts`) re-checks entitlement server-side before ever creating a
 * plan - this page's own redirect is the fast, friendly front for that real
 * enforcement, never the only thing standing between a bug here and a free
 * workspace.
 */
export default async function BudgetOnboardingPage() {
  const access = await resolveBudgetPlannerAccess();

  if (access.status === "granted") {
    redirect("/app/budget-planner");
  }
  if (access.status === "needs-purchase") {
    redirect("/app/budget-planner/checkout");
  }

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow>Budget Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Let&rsquo;s get your budget started
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          A few quick steps to set things up. Everything here is optional except the basics - you
          can always add or change the rest once you&rsquo;re in your workspace.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <OnboardingWizard />
      </Card>
    </Container>
  );
}

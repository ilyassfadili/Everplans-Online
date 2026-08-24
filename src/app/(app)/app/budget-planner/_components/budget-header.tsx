import { Eyebrow, Heading, Text } from "@/components/ui";
import { getPeriodLabel } from "@/lib/budget/period";
import type { BudgetPlan } from "@/types/budget";

interface BudgetHeaderProps {
  plan: BudgetPlan;
}

/**
 * The workspace's own identity block - this product's equivalent of
 * `WeddingHeader`. Real session data only (this user's own plan, resolved
 * server-side): the plan's own name, and how often it's planned around.
 */
export function BudgetHeader({ plan }: BudgetHeaderProps) {
  return (
    <div className="animate-hero-in" style={{ animationDelay: "40ms" }}>
      <Eyebrow tone="brand">Your Budget</Eyebrow>
      <Heading as="h1" size="h2" className="mt-1">
        {plan.name}
      </Heading>
      <Text size="body-lg" tone="muted" className="mt-2">
        Planning every {getPeriodLabel(plan.periodType)}
      </Text>
    </div>
  );
}

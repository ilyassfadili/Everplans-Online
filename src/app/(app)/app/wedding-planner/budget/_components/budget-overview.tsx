import { Card, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/wedding/currency";
import type { WeddingBudgetSummary } from "@/types/wedding";

interface BudgetOverviewProps {
  summary: WeddingBudgetSummary;
  currency: string;
}

/**
 * "Total planned budget / actual spending / remaining" (Phase 2) - the
 * three numbers that matter, nothing else. A single calm progress bar
 * shows spent-vs-planned at a glance; no pie chart or breakdown-by-category
 * chart here (Phase 2: "do not introduce charts simply for decoration" -
 * the category list right below this already shows the breakdown).
 */
export function BudgetOverview({ summary, currency }: BudgetOverviewProps) {
  if (summary.totalPlannedCents === 0 && summary.totalActualCents === 0) {
    return (
      <Card variant="standard" padding="lg">
        <Heading as="h2" size="h4">
          Budget
        </Heading>
        <Text size="body" tone="muted" className="mt-1.5">
          Add a category below to start planning your budget.
        </Text>
      </Card>
    );
  }

  const percentSpent =
    summary.totalPlannedCents === 0 ? 0 : Math.min(100, Math.round((summary.totalActualCents / summary.totalPlannedCents) * 100));
  const isOverBudget = summary.remainingCents < 0;

  return (
    <Card variant="standard" padding="lg">
      <Heading as="h2" size="h4">
        Budget
      </Heading>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <Text size="body-sm" tone="muted">
            Planned
          </Text>
          <Text size="body-lg" weight="semibold" className="text-ink">
            {formatCurrency(summary.totalPlannedCents, currency)}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Spent
          </Text>
          <Text size="body-lg" weight="semibold" className="text-ink">
            {formatCurrency(summary.totalActualCents, currency)}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            {isOverBudget ? "Over by" : "Remaining"}
          </Text>
          <Text size="body-lg" weight="semibold" className={isOverBudget ? "text-warning" : "text-ink"}>
            {formatCurrency(Math.abs(summary.remainingCents), currency)}
          </Text>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${isOverBudget ? "bg-warning" : "bg-brand"}`}
          style={{ width: `${percentSpent}%` }}
        />
      </div>
    </Card>
  );
}

import { Card, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetSummary } from "@/types/budget";

interface BudgetVsActualOverviewProps {
  summary: BudgetSummary;
  currency: string;
}

/**
 * The overall "am I spending more or less than I planned?" read (Prompt 3
 * Phase 2) - distinct from `BudgetOverview`'s income-vs-planned allocation
 * question just above it on the page. Same numbers `calculateBudgetSummary`
 * already produces for the dashboard - never a second, independently
 * computed comparison.
 */
export function BudgetVsActualOverview({ summary, currency }: BudgetVsActualOverviewProps) {
  if (summary.totalPlannedCents === 0) {
    return null;
  }

  const difference = summary.totalPlannedCents - summary.totalActualCents;
  const isOver = difference < 0;
  const percentSpent = Math.round((summary.totalActualCents / summary.totalPlannedCents) * 100);

  return (
    <Card variant="standard" padding="lg">
      <Heading as="h2" size="h4">
        Budget vs. actual
      </Heading>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Figure label="Planned" value={formatCurrency(summary.totalPlannedCents, currency)} />
        <Figure label="Actual" value={formatCurrency(summary.totalActualCents, currency)} />
        <Figure label={isOver ? "Over by" : "Under by"} value={formatCurrency(Math.abs(difference), currency)} />
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${isOver ? "bg-error" : "bg-brand"}`}
          style={{ width: `${Math.min(100, percentSpent)}%` }}
        />
      </div>
      <Text size="body-sm" tone="muted" className="mt-2">
        {isOver
          ? `You've spent ${percentSpent}% of what you planned - a bit more than expected.`
          : `You've spent ${percentSpent}% of what you planned so far.`}
      </Text>
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="body-sm" tone="muted">
        {label}
      </Text>
      <Text size="body-lg" weight="semibold" className="text-ink">
        {value}
      </Text>
    </div>
  );
}

import { PiggyBank } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/wedding/currency";
import type { WeddingBudgetSummary } from "@/types/wedding";

import { PanelHeader } from "./panel-header";

interface BudgetSummaryProps {
  summary: WeddingBudgetSummary;
  currency: string;
  hasAnyCategories: boolean;
}

/** The dashboard's concise budget glance (Phase 3: "surface a concise budget summary... do not overwhelm the dashboard") - spent-vs-total as a single glanceable bar, everything else lives on the full budget page. */
export function BudgetSummary({ summary, currency, hasAnyCategories }: BudgetSummaryProps) {
  const percentSpent =
    summary.totalPlannedCents > 0 ? Math.round((summary.totalActualCents / summary.totalPlannedCents) * 100) : 0;
  const isOverBudget = summary.remainingCents < 0;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={PiggyBank}
        tone="success"
        title="Budget"
        action={
          <Button href="/app/wedding-planner/budget" variant="outline" size="sm">
            View budget
          </Button>
        }
      />

      {!hasAnyCategories ? (
        <EmptyState
          icon={PiggyBank}
          title="Give your budget a shape"
          description="Set up a category and start turning your vision into a real plan you can watch take shape."
          className="mt-4 py-10"
        />
      ) : (
        <div className="mt-4 flex flex-1 flex-col justify-center">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Text size="body-sm" tone="muted">
                Spent
              </Text>
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatCurrency(summary.totalActualCents, currency)}
              </Text>
            </div>
            <div className="text-right">
              <Text size="body-sm" tone="muted">
                Total Budget
              </Text>
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatCurrency(summary.totalPlannedCents, currency)}
              </Text>
            </div>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${isOverBudget ? "bg-warning" : "bg-brand"}`}
              style={{ width: `${Math.min(100, percentSpent)}%` }}
            />
          </div>
          <Text size="body-sm" tone="muted" className="mt-2">
            {isOverBudget
              ? `${percentSpent}% spent - ${formatCurrency(Math.abs(summary.remainingCents), currency)} over budget`
              : `${percentSpent}% of budget spent`}
          </Text>
        </div>
      )}
    </Card>
  );
}

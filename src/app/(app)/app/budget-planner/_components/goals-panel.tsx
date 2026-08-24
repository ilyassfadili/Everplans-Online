import { Target } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { getPeriodLabel } from "@/lib/budget/period";
import type { BudgetGoal, BudgetPeriodType } from "@/types/budget";

import { PanelHeader } from "./panel-header";

interface GoalsPanelProps {
  goals: BudgetGoal[];
  currency: string;
  /** Planned savings per period (Prompt 3 Phase 4) - `0` renders nothing extra, keeping the dashboard's own "do not overload it" rule intact. */
  plannedSavingsCents?: number;
  periodType?: BudgetPeriodType;
}

/** The dashboard's concise goals glance - the goal furthest along (or first created), a progress bar, a link to the rest, and (when set) planned savings per period. */
export function GoalsPanel({ goals, currency, plannedSavingsCents = 0, periodType }: GoalsPanelProps) {
  const featured = goals[0] ?? null;
  const percent = featured && featured.targetAmountCents > 0 ? Math.min(100, Math.round((featured.currentAmountCents / featured.targetAmountCents) * 100)) : 0;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Target}
        title="Goals"
        action={
          <Button href="/app/budget-planner/goals" variant="outline" size="sm">
            View goals
          </Button>
        }
      />

      {!featured ? (
        <EmptyState
          icon={Target}
          title="Set your first goal"
          description="Give your budget something to work toward - an emergency fund, a trip, anything you're saving for."
          className="mt-4 py-10"
        />
      ) : (
        <div className="mt-4 flex flex-1 flex-col justify-center">
          <div className="flex items-center justify-between gap-3">
            <Text weight="medium" className="text-ink">
              {featured.name}
            </Text>
            <Text size="body-sm" tone="muted">
              {percent}%
            </Text>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
          <Text size="body-sm" tone="muted" className="mt-2">
            {formatCurrency(featured.currentAmountCents, currency)} of {formatCurrency(featured.targetAmountCents, currency)}
          </Text>
          {goals.length > 1 && (
            <Text size="caption" tone="faint" className="mt-1">
              +{goals.length - 1} more {goals.length - 1 === 1 ? "goal" : "goals"}
            </Text>
          )}
          {plannedSavingsCents > 0 && periodType && (
            <Text size="caption" tone="faint" className="mt-2">
              {formatCurrency(plannedSavingsCents, currency)} planned in savings per {getPeriodLabel(periodType)}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
}

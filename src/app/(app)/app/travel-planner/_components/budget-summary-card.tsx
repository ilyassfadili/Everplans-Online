import { Wallet } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/travel/currency";
import type { TripBudgetSummary } from "@/types/travel";

import { PanelHeader } from "./panel-header";

interface BudgetSummaryCardProps {
  summary: TripBudgetSummary;
  currency: string;
}

/**
 * The dashboard's budget summary (Prompt 3 Phase 4 §3) - spent vs.
 * remaining against the total budget, read from the exact same
 * `calculateBudgetSummary` the Budget page itself uses, so the two can
 * never disagree (Phase 4 §10: "no duplicated source of truth"). No
 * category breakdown here - that's what "Review budget" is for; this card
 * only answers "am I on track."
 */
export function BudgetSummaryCard({ summary, currency }: BudgetSummaryCardProps) {
  if (summary.totalBudgetCents === 0) {
    return (
      <Card variant="standard" padding="lg" className="flex h-full flex-col">
        <PanelHeader icon={Wallet} title="Budget" />
        <EmptyState
          className="mt-4 border-none bg-transparent px-0 py-6"
          title="No budget set yet"
          description="Set a total budget to start tracking what you plan to spend and what you actually spend."
          action={
            <Button href="/app/travel-planner/budget" variant="secondary" size="sm">
              Set up budget
            </Button>
          }
        />
      </Card>
    );
  }

  const isOverBudget = summary.remainingCents < 0;
  const percentSpent =
    summary.totalBudgetCents === 0 ? 0 : Math.min(100, Math.round((summary.totalActualCents / summary.totalBudgetCents) * 100));

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={Wallet} title="Budget" />
      <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
        <div className="grid grid-cols-2 gap-4">
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

        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className={`h-full rounded-full ${isOverBudget ? "bg-warning" : "bg-brand"}`} style={{ width: `${percentSpent}%` }} />
          </div>
          <Button href="/app/travel-planner/budget" variant="ghost" size="sm" className="mt-3">
            Review budget
          </Button>
        </div>
      </div>
    </Card>
  );
}

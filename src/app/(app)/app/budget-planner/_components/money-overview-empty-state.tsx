import { Coins } from "lucide-react";

import { Button, EmptyState } from "@/components/ui";
import { formatMonthLabel } from "@/lib/budget/month";
import type { MonthKey } from "@/lib/budget/month";

interface MoneyOverviewEmptyStateProps {
  month: MonthKey;
}

/**
 * The Money Overview's empty state for a month with no income or expenses
 * logged yet (Everplans Money Prompt 1 Phase 3 / Prompt 3) - replaces the
 * at-a-glance cards, spending-by-category bars, and recent-activity list
 * entirely rather than showing $0 cards or an empty chart shell, same
 * "calm, encouraging, one clear next step" tone `StatusSummary`'s own
 * "no income yet" partial state already uses one level down.
 */
export function MoneyOverviewEmptyState({ month }: MoneyOverviewEmptyStateProps) {
  return (
    <EmptyState
      icon={Coins}
      title={`Nothing logged for ${formatMonthLabel(month)} yet`}
      description="Once you add income or an expense for this month, your totals, spending by category, and recent activity will show up here."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/app/budget-planner/income" size="sm">
            Add income
          </Button>
          <Button href="/app/budget-planner/expenses" variant="outline" size="sm">
            Add an expense
          </Button>
        </div>
      }
    />
  );
}

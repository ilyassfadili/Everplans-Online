import { PiggyBank } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetCategorySummary } from "@/types/budget";

import { PanelHeader } from "./panel-header";

interface CategoriesPanelProps {
  categorySummaries: BudgetCategorySummary[];
  currency: string;
}

/** The dashboard's concise budget glance - planned vs. actual across all categories, plus which ones need a look. Full detail lives on the Budget page. */
export function CategoriesPanel({ categorySummaries, currency }: CategoriesPanelProps) {
  const totalPlanned = categorySummaries.reduce((sum, summary) => sum + summary.category.plannedAmountCents, 0);
  const totalActual = categorySummaries.reduce((sum, summary) => sum + summary.actualCents, 0);
  const overBudgetCount = categorySummaries.filter((summary) => summary.isOverBudget).length;
  const percentSpent = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={PiggyBank}
        tone="success"
        title="Budget"
        action={
          <Button href="/app/budget-planner/budget" variant="outline" size="sm">
            View budget
          </Button>
        }
      />

      {categorySummaries.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Give your budget a shape"
          description="Set up a category and start turning your plan into something you can watch take shape."
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
                {formatCurrency(totalActual, currency)}
              </Text>
            </div>
            <div className="text-right">
              <Text size="body-sm" tone="muted">
                Planned
              </Text>
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatCurrency(totalPlanned, currency)}
              </Text>
            </div>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${overBudgetCount > 0 ? "bg-warning" : "bg-brand"}`}
              style={{ width: `${Math.min(100, percentSpent)}%` }}
            />
          </div>
          <Text size="body-sm" tone="muted" className="mt-2">
            {overBudgetCount > 0
              ? `${overBudgetCount} ${overBudgetCount === 1 ? "category is" : "categories are"} over its planned amount`
              : `${percentSpent}% of planned spending used`}
          </Text>
        </div>
      )}
    </Card>
  );
}

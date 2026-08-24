import { Receipt } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetExpense } from "@/types/budget";

import { PanelHeader } from "./panel-header";

interface ExpensesPanelProps {
  recentExpenses: BudgetExpense[];
  currency: string;
}

function formatExpenseDate(expenseDate: string): string {
  const date = new Date(`${expenseDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The dashboard's recent-activity glance - the last few expenses logged, so the dashboard reflects real recent spending without duplicating the full Expenses page. */
export function ExpensesPanel({ recentExpenses, currency }: ExpensesPanelProps) {
  const preview = recentExpenses.slice(0, 4);

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Receipt}
        title="Recent expenses"
        action={
          <Button href="/app/budget-planner/expenses" variant="outline" size="sm">
            View expenses
          </Button>
        }
      />

      {preview.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nothing logged yet"
          description="Record what you spend to see it land against your budget."
          className="mt-4 py-10"
        />
      ) : (
        <ul className="mt-3 flex flex-1 flex-col divide-y divide-line-subtle">
          {preview.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Text size="body-sm" weight="medium" className="truncate text-ink">
                  {expense.title}
                </Text>
                <Text size="caption" tone="faint">
                  {formatExpenseDate(expense.expenseDate)}
                </Text>
              </div>
              <Text size="body-sm" weight="medium" className="shrink-0 text-ink">
                {formatCurrency(expense.amountCents, currency)}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

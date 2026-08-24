import { Receipt } from "lucide-react";

import { Card, EmptyState, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetAccount, BudgetCategory, BudgetExpense } from "@/types/budget";

import { ExpenseRow } from "./expense-row";

interface ExpenseListProps {
  expenses: BudgetExpense[];
  categories: BudgetCategory[];
  currency: string;
  accounts: BudgetAccount[];
  allAccounts: BudgetAccount[];
}

/** Every expense, grouped by category (uncategorized last) - the same grouping `wedding-planner/budget`'s `ExpenseList` uses, so spending always reads next to the plan it's measured against. */
export function ExpenseList({ expenses, categories, currency, accounts, allAccounts }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <Card variant="standard" padding="lg">
        <EmptyState
          icon={Receipt}
          title="Nothing logged yet"
          description="Record what you actually spend to see it land against your planned categories."
          className="py-10"
        />
      </Card>
    );
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(allAccounts.map((account) => [account.id, account]));
  const groups = new Map<string, BudgetExpense[]>();

  for (const expense of expenses) {
    const key = expense.categoryId ?? "uncategorized";
    const group = groups.get(key) ?? [];
    group.push(expense);
    groups.set(key, group);
  }

  const orderedKeys = [...categories.map((category) => category.id), "uncategorized"].filter((key) => groups.has(key));

  return (
    <div className="flex flex-col gap-4">
      {orderedKeys.map((key) => {
        const groupExpenses = groups.get(key)!;
        const category = key === "uncategorized" ? null : categoryById.get(key);
        const total = groupExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

        return (
          <Card key={key} variant="standard" padding="lg">
            <div className="flex items-center justify-between gap-3">
              <Heading as="h3" size="h4">
                {category ? category.name : "Uncategorized"}
              </Heading>
              <Text size="body-sm" weight="medium" tone="muted">
                {formatCurrency(total, currency)}
              </Text>
            </div>
            <ul className="mt-2 flex flex-col divide-y divide-line-subtle">
              {groupExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  currency={currency}
                  categories={categories}
                  categoryName={null}
                  accounts={accounts}
                  accountName={expense.accountId ? (accountById.get(expense.accountId)?.name ?? null) : null}
                />
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { Receipt } from "lucide-react";

import { Card, EmptyState, Heading, Text } from "@/components/ui";
import { getUncategorizedExpenses } from "@/lib/travel/budget";
import { formatCurrency } from "@/lib/travel/currency";
import type { UpdateExpenseInput } from "@/lib/travel/expenses";
import type { TripBudgetCategory, TripExpense } from "@/types/travel";

import { deleteExpenseAction, updateExpenseAction } from "../actions";
import { ExpenseRow } from "./expense-row";

interface ExpenseGroup {
  key: string;
  title: string;
  expenses: TripExpense[];
}

function groupByCategory(expenses: TripExpense[], categories: TripBudgetCategory[]): ExpenseGroup[] {
  const groups: ExpenseGroup[] = [];

  for (const category of categories) {
    const categoryExpenses = expenses.filter((expense) => expense.categoryId === category.id);
    if (categoryExpenses.length > 0) {
      groups.push({ key: category.id, title: category.name, expenses: categoryExpenses });
    }
  }

  const uncategorized = getUncategorizedExpenses(expenses);
  if (uncategorized.length > 0) {
    groups.push({ key: "uncategorized", title: "Uncategorized", expenses: uncategorized });
  }

  return groups;
}

interface ExpenseListProps {
  expenses: TripExpense[];
  categories: TripBudgetCategory[];
  currency: string;
}

/** All expenses, grouped by category (matches the category list's own order), most recent within each group first (already sorted by the query). */
export function ExpenseList({ expenses, categories, currency }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Add your first expense above to start tracking real spending."
        className="py-14"
      />
    );
  }

  async function handleSave(expenseId: string, input: UpdateExpenseInput) {
    return updateExpenseAction(expenseId, input);
  }

  const groups = groupByCategory(expenses, categories);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const groupTotal = group.expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
        return (
          <Card key={group.key} variant="standard" padding="lg">
            <div className="flex items-center justify-between gap-3">
              <Heading as="h2" size="h4">
                {group.title}
              </Heading>
              <Text size="body-sm" tone="muted">
                {formatCurrency(groupTotal, currency)}
              </Text>
            </div>
            <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
              {group.expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  categories={categories}
                  currency={currency}
                  onSave={handleSave}
                  onDelete={deleteExpenseAction}
                />
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

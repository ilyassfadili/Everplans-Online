"use client";

import { Receipt } from "lucide-react";

import { Card, EmptyState, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/wedding/currency";
import { getUncategorizedExpenses } from "@/lib/wedding/budget";
import type { WeddingBudgetCategory, WeddingExpense, WeddingVendor } from "@/types/wedding";

import { ExpenseRow } from "./expense-row";

interface ExpenseGroup {
  key: string;
  title: string;
  expenses: WeddingExpense[];
}

function groupByCategory(expenses: WeddingExpense[], categories: WeddingBudgetCategory[]): ExpenseGroup[] {
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
  weddingId: string;
  expenses: WeddingExpense[];
  categories: WeddingBudgetCategory[];
  vendors: WeddingVendor[];
  currency: string;
}

/** All expenses, grouped by category (Phase 3: "appropriate grouping/sorting"), most recent within each group first (already sorted by the query). */
export function ExpenseList({ weddingId, expenses, categories, vendors, currency }: ExpenseListProps) {
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

  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
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
                  weddingId={weddingId}
                  expense={expense}
                  currency={currency}
                  categories={categories}
                  vendorName={expense.vendorId ? (vendorById.get(expense.vendorId) ?? null) : null}
                />
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

import "server-only";

import { getAllCategoriesForPlan } from "@/lib/budget/categories";
import { getExpensesForPlan } from "@/lib/budget/expenses";
import { getIncomeEntriesForPlan } from "@/lib/budget/income-entries";
import type { MonthKey } from "@/lib/budget/month";
import { getMonthDateRange } from "@/lib/budget/month";
import type { MonthlyCategoryBreakdown, MonthlyOverview } from "@/types/budget";

const RECENT_ACTIVITY_LIMIT = 8;

/**
 * The Money Overview's month-scoped read (Everplans Money Prompt 1 Phase 3 /
 * Prompt 3's Overview integration) - real income/expense/net for exactly
 * one calendar month, computed fresh from `budget_income_entries` and
 * `budget_expenses` rows dated within it. Deliberately independent of
 * `calculateBudgetSummary` (`@/lib/budget/budget.ts`), which answers a
 * different question ("expected income vs. planned vs. actual, right now,"
 * unscoped to any one month) - this answers "what actually happened in
 * August." Both read the same underlying tables, so neither can silently
 * drift from the truth the other shows; they simply describe different
 * things.
 */
export async function getMonthlyOverview(planId: string, month: MonthKey): Promise<MonthlyOverview> {
  const dateRange = getMonthDateRange(month);

  const [expenses, incomeEntries, categories] = await Promise.all([
    getExpensesForPlan(planId, dateRange),
    getIncomeEntriesForPlan(planId, dateRange),
    getAllCategoriesForPlan(planId, "expense"),
  ]);

  const totalIncomeCents = incomeEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
  const totalExpenseCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  const spendByCategory = new Map<string, number>();
  for (const expense of expenses) {
    if (!expense.categoryId) continue;
    spendByCategory.set(expense.categoryId, (spendByCategory.get(expense.categoryId) ?? 0) + expense.amountCents);
  }

  const categoryBreakdown: MonthlyCategoryBreakdown[] = categories
    .filter((category) => spendByCategory.has(category.id))
    .map((category) => ({ category, actualCents: spendByCategory.get(category.id)! }))
    .sort((a, b) => b.actualCents - a.actualCents);

  const recentTransactions = [
    ...expenses.map((expense) => ({
      id: expense.id,
      type: "expense" as const,
      title: expense.title,
      amountCents: expense.amountCents,
      date: expense.expenseDate,
      categoryId: expense.categoryId,
      accountId: expense.accountId,
      note: expense.note,
    })),
    ...incomeEntries.map((entry) => ({
      id: entry.id,
      type: "income" as const,
      title: entry.title,
      amountCents: entry.amountCents,
      date: entry.entryDate,
      categoryId: entry.categoryId,
      accountId: entry.accountId,
      note: entry.note,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RECENT_ACTIVITY_LIMIT);

  return {
    month,
    totalIncomeCents,
    totalExpenseCents,
    netCents: totalIncomeCents - totalExpenseCents,
    categoryBreakdown,
    recentTransactions,
    transactionCount: expenses.length + incomeEntries.length,
  };
}

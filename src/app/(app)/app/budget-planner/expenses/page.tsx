import type { Metadata } from "next";
import { Container, Text } from "@/components/ui";
import { getAllAccountsForPlan, getAccountsForPlan } from "@/lib/budget/accounts";
import { getAllCategoriesForPlan, getCategoriesForPlan } from "@/lib/budget/categories";
import { formatCurrency } from "@/lib/budget/currency";
import { getExpensesForPlan } from "@/lib/budget/expenses";
import { getMonthDateRange, parseMonthParam } from "@/lib/budget/month";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";

import { MonthSwitcher } from "../_components/month-switcher";
import { PageHeader } from "../../_components/page-header";
import { AddExpenseForm } from "./_components/add-expense-form";
import { ExpensesBrowser } from "./_components/expenses-browser";

export const metadata: Metadata = {
  title: "Expenses",
  robots: { index: false, follow: false },
};

/**
 * The Budget Planner's Expenses page - actual spending. Two different
 * category lists on purpose (Prompt 5 Phase 1's own category-safety
 * requirement): `activeCategories` (excludes archived) for the "assign a
 * category" pickers, so a new or reassigned expense can never be pointed
 * at an archived one, and `allCategories` (includes archived) for display -
 * an expense that already references an archived category must still show
 * its real name and group correctly instead of reading as "uncategorized."
 * Accounts follow the identical split (Everplans Money Prompt 1's "Accounts
 * foundation"): `accounts` (active only) for pickers, `allAccounts` for
 * display so an expense already pointed at an archived account still shows
 * its name.
 *
 * Month-scoped like the Money Overview and Income pages (Prompt 2 Phase 4's
 * "monthly context must work consistently across" requirement) - `?month=`
 * picks the calendar month, defaulting to the current one, and only that
 * month's expenses are fetched. `ExpensesBrowser`'s own client-side
 * search/sort still operates over the fetched list unchanged; it's just a
 * month-scoped list now instead of the plan's entire history.
 */
export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const plan = await requireBudgetPlanForCurrentUser();

  const { month: monthParam } = await searchParams;
  const month = parseMonthParam(monthParam);
  const dateRange = getMonthDateRange(month);

  const [activeCategories, allCategories, activeAccounts, allAccounts, expenses] = await Promise.all([
    getCategoriesForPlan(plan.id, "expense"),
    getAllCategoriesForPlan(plan.id, "expense"),
    getAccountsForPlan(plan.id),
    getAllAccountsForPlan(plan.id),
    getExpensesForPlan(plan.id, dateRange),
  ]);

  const totalExpenseCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Expenses" description="Record what you actually spend and see it land against your budget." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthSwitcher month={month} basePath="/app/budget-planner/expenses" />
        <Text size="body-sm" tone="muted">
          Total expenses this month: <span className="font-medium text-ink">{formatCurrency(totalExpenseCents, plan.currency)}</span>
        </Text>
      </div>

      <AddExpenseForm planId={plan.id} categories={activeCategories} accounts={activeAccounts} />
      <ExpensesBrowser expenses={expenses} categories={allCategories} currency={plan.currency} accounts={activeAccounts} allAccounts={allAccounts} />
    </Container>
  );
}

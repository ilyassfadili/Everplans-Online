import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { calculateBudgetSummary, calculateCategorySummaries } from "@/lib/travel/budget";
import { getBudgetCategoriesForTrip } from "@/lib/travel/budget-categories";
import { getExpensesForTrip } from "@/lib/travel/expenses";
import { requireTripForCurrentUser } from "@/lib/travel/trips";

import { PageHeader } from "../../_components/page-header";
import { AddExpenseForm } from "./_components/add-expense-form";
import { BudgetOverview } from "./_components/budget-overview";
import { CategoryList } from "./_components/category-list";
import { ExpenseList } from "./_components/expense-list";

export const metadata: Metadata = {
  title: "Budget",
  robots: { index: false, follow: false },
};

/**
 * The Travel Planner's Budget page (Everplans Travel Planner Prompt 3,
 * Phases 1-2) - a total planned budget, broken into categories, with real
 * expenses tracked against it. Gated the same way every Travel Planner
 * route is: no trip yet redirects to trip setup.
 */
export default async function BudgetPage() {
  const trip = await requireTripForCurrentUser();

  const [categories, expenses] = await Promise.all([
    getBudgetCategoriesForTrip(trip.id),
    getExpensesForTrip(trip.id),
  ]);

  const summary = calculateBudgetSummary(trip.totalBudgetCents, categories, expenses);
  const categorySummaries = calculateCategorySummaries(categories, expenses);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Budget" description="Set what you plan to spend, then track what you actually spend." />
      <BudgetOverview tripId={trip.id} summary={summary} currency={trip.currency} />
      <CategoryList tripId={trip.id} categorySummaries={categorySummaries} currency={trip.currency} />
      <AddExpenseForm tripId={trip.id} categories={categories} />
      <ExpenseList expenses={expenses} categories={categories} currency={trip.currency} />
    </Container>
  );
}

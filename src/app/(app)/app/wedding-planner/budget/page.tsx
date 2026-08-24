import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui";
import { calculateBudgetSummary, calculateCategorySummaries } from "@/lib/wedding/budget";
import { getBudgetCategoriesForWedding } from "@/lib/wedding/budget-categories";
import { getExpensesForWedding } from "@/lib/wedding/expenses";
import { getVendorsForWedding } from "@/lib/wedding/vendors";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

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
 * The Wedding Planner's budget (Prompt 3 Phases 2-4) - planned categories,
 * real expenses, and the vendor each optionally went to, all derived into
 * one overview at request time (`calculateBudgetSummary`,
 * `calculateCategorySummaries`) rather than any total being stored on its
 * own. Gated the same way every Wedding Planner route is: no workspace yet
 * redirects to onboarding.
 */
export default async function BudgetPage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const [categories, expenses, vendors] = await Promise.all([
    getBudgetCategoriesForWedding(wedding.id),
    getExpensesForWedding(wedding.id),
    getVendorsForWedding(wedding.id),
  ]);

  const summary = calculateBudgetSummary(categories, expenses);
  const categorySummaries = calculateCategorySummaries(categories, expenses);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Budget" description="Plan what you expect to spend, then track it as your day comes together." />

      <BudgetOverview summary={summary} currency={wedding.currency} />
      <CategoryList weddingId={wedding.id} categorySummaries={categorySummaries} currency={wedding.currency} />

      <div className="flex flex-col gap-6">
        <AddExpenseForm weddingId={wedding.id} categories={categories} vendors={vendors} />
        <ExpenseList weddingId={wedding.id} expenses={expenses} categories={categories} vendors={vendors} currency={wedding.currency} />
      </div>
    </Container>
  );
}

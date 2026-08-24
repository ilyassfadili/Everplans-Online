import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { calculateBudgetSummary, calculateCategorySummaries } from "@/lib/budget/budget";
import { getArchivedCategoriesForPlan, getCategoriesForPlan } from "@/lib/budget/categories";
import { getExpensesForPlan } from "@/lib/budget/expenses";
import { getIncomeSourcesForPlan } from "@/lib/budget/income-sources";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";

import { PageHeader } from "../../_components/page-header";
import { ArchivedCategories } from "./_components/archived-categories";
import { BudgetOverview } from "./_components/budget-overview";
import { BudgetVsActualOverview } from "./_components/budget-vs-actual-overview";
import { CategoryList } from "./_components/category-list";
import { ReallocateForm } from "./_components/reallocate-form";

export const metadata: Metadata = {
  title: "Budget",
  robots: { index: false, follow: false },
};

/** The Budget Planner's Budget page - categories, how they compare to expected income, and (Prompt 3 Phase 2) how planned spending compares to actual. */
export default async function BudgetPage() {
  const plan = await requireBudgetPlanForCurrentUser();

  const [incomeSources, categories, expenses, archivedCategories] = await Promise.all([
    getIncomeSourcesForPlan(plan.id),
    getCategoriesForPlan(plan.id, "expense"),
    getExpensesForPlan(plan.id),
    getArchivedCategoriesForPlan(plan.id, "expense"),
  ]);

  const summary = calculateBudgetSummary(incomeSources, categories, expenses, plan.periodType);
  const categorySummaries = calculateCategorySummaries(categories, expenses);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Budget" description="Set what you plan to spend, organized by category." />
      <BudgetOverview summary={summary} categorySummaries={categorySummaries} currency={plan.currency} />
      <BudgetVsActualOverview summary={summary} currency={plan.currency} />
      <CategoryList planId={plan.id} categorySummaries={categorySummaries} currency={plan.currency} />
      <ReallocateForm categories={categories} currency={plan.currency} />
      <ArchivedCategories archivedCategories={archivedCategories} />
    </Container>
  );
}

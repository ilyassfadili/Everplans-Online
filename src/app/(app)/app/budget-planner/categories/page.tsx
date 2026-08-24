import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { getAllCategoriesForPlan } from "@/lib/budget/categories";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";

import { PageHeader } from "../../_components/page-header";
import { AddCategoryForm } from "./_components/add-category-form";
import { CategorySection } from "./_components/category-section";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

/**
 * The Budget Planner's dedicated Categories page (Everplans Money Prompt 2)
 * - simple category *identity* management (name, kind, archive/restore) for
 * both income and expense categories in one place. Deliberately narrower
 * than the Budget page's own category list: this page never touches planned
 * amounts or groups - that's budget *allocation*, which stays exclusive to
 * `/app/budget-planner/budget` and its expense-only `CategoryList`.
 */
export default async function CategoriesPage() {
  const plan = await requireBudgetPlanForCurrentUser();

  // Both kinds, active + archived, in one query - split here into the two
  // sections below rather than issuing four separate queries.
  const categories = await getAllCategoriesForPlan(plan.id);
  const incomeCategories = categories.filter((category) => category.kind === "income");
  const expenseCategories = categories.filter((category) => category.kind === "expense");

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Categories" description="Manage the categories available across your income and expenses." />
      <AddCategoryForm planId={plan.id} />
      <CategorySection title="Income categories" emptyMessage="No income categories yet." categories={incomeCategories} />
      <CategorySection title="Expense categories" emptyMessage="No expense categories yet." categories={expenseCategories} />
    </Container>
  );
}

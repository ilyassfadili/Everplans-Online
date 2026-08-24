"use client";

import { Card, Heading, Stack } from "@/components/ui";
import type { BudgetCategoryMutationResult, CreateBudgetCategoryInput, UpdateBudgetCategoryInput } from "@/lib/travel/budget-categories";
import type { TripBudgetCategorySummary } from "@/types/travel";

import { createBudgetCategoryAction, deleteBudgetCategoryAction, updateBudgetCategoryAction } from "../actions";
import { AddCategoryForm } from "./add-category-form";
import { CategoryRow } from "./category-row";

interface CategoryListProps {
  tripId: string;
  categorySummaries: TripBudgetCategorySummary[];
  currency: string;
}

/** The budget's category list - one row per category (with its actual spending once any exists), plus quick-add/custom-add. Bound to `tripId` here so every child gets ready-to-call actions without threading it through each row. */
export function CategoryList({ tripId, categorySummaries, currency }: CategoryListProps) {
  async function handleAdd(input: CreateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
    return createBudgetCategoryAction(tripId, input);
  }

  async function handleSave(categoryId: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
    return updateBudgetCategoryAction(categoryId, input);
  }

  return (
    <Card variant="standard" padding="lg">
      <Heading as="h2" size="h4">
        Categories
      </Heading>
      <div className="mt-4 flex flex-col gap-4">
        {categorySummaries.length > 0 && (
          <Stack gap="2">
            {categorySummaries.map((summary) => (
              <CategoryRow key={summary.category.id} summary={summary} currency={currency} onSave={handleSave} onDelete={deleteBudgetCategoryAction} />
            ))}
          </Stack>
        )}
        <AddCategoryForm existingNames={categorySummaries.map((summary) => summary.category.name)} onAdd={handleAdd} />
      </div>
    </Card>
  );
}

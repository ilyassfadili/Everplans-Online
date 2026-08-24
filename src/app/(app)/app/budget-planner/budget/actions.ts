"use server";

import { revalidatePath } from "next/cache";

import {
  archiveCategory,
  createCategory,
  moveCategory,
  reallocateBetweenCategories,
  restoreCategory,
  updateCategory,
  type BudgetCategoryMutationResult,
  type ReallocateResult,
  type UpdateBudgetCategoryInput,
} from "@/lib/budget/categories";
import type { BudgetCategoryGroup } from "@/types/budget";

/**
 * The Budget page's own Server Actions - thin wrappers around
 * `@/lib/budget/categories`, colocated here since only this route (and the
 * dashboard's own read-only summary) touches category data, the same split
 * `wedding-planner/budget/actions.ts` uses for its categories.
 */

const BUDGET_PATH = "/app/budget-planner/budget";
const BUDGET_PLANNER_PATH = "/app/budget-planner";

function revalidateBudget() {
  revalidatePath(BUDGET_PATH);
  revalidatePath(BUDGET_PLANNER_PATH);
}

export interface CreateCategoryFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createCategoryFormAction(
  planId: string,
  _prevState: CreateCategoryFormState,
  formData: FormData,
): Promise<CreateCategoryFormState> {
  const name = formData.get("name");
  const plannedAmount = formData.get("plannedAmountCents");
  const group = formData.get("group");

  const result = await createCategory(planId, {
    name: typeof name === "string" ? name : "",
    plannedAmountCents: typeof plannedAmount === "string" ? plannedAmount : undefined,
    // Cast, not trusted blindly - `createCategory`'s own zod schema
    // re-validates this against the real enum; this only satisfies the
    // input type for a value the form's own `<Select>` already constrains.
    group: typeof group === "string" && group ? (group as BudgetCategoryGroup) : undefined,
  });

  if (result.status === "success") {
    revalidateBudget();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editCategoryAction(categoryId: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
  const result = await updateCategory(categoryId, input);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export async function removeCategoryAction(categoryId: string): Promise<void> {
  await archiveCategory(categoryId);
  revalidateBudget();
}

export async function restoreCategoryAction(categoryId: string): Promise<void> {
  await restoreCategory(categoryId);
  revalidateBudget();
}

export async function moveCategoryAction(planId: string, categoryId: string, direction: "up" | "down"): Promise<void> {
  await moveCategory(planId, categoryId, direction);
  revalidateBudget();
}

export interface ReallocateFormInput {
  fromCategoryId: string;
  toCategoryId: string;
  amountCents: string;
}

export async function reallocateCategoriesAction(input: ReallocateFormInput): Promise<ReallocateResult> {
  const result = await reallocateBetweenCategories(input);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

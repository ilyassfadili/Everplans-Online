"use server";

import { revalidatePath } from "next/cache";

import {
  archiveCategory,
  createCategory,
  restoreCategory,
  updateCategory,
  type BudgetCategoryMutationResult,
  type DeleteBudgetCategoryResult,
} from "@/lib/budget/categories";
import type { BudgetCategoryKind } from "@/types/budget";

/**
 * The dedicated Categories page's own Server Actions (Everplans Money
 * Prompt 2) - thin wrappers around `@/lib/budget/categories`, same split
 * `budget/actions.ts` uses (a `useActionState`-compatible wrapper for
 * create, plain async functions for rename/archive/restore called directly
 * from client components).
 *
 * Every mutation here revalidates this page plus every other budget-planner
 * route that reads category names or pickers (Budget, Income, Expenses,
 * Transactions) - unlike `budget/actions.ts`'s `revalidateBudget`, which
 * only needs to cover the Budget page's own narrower blast radius, this
 * page can create/rename/archive *income* categories too, which those other
 * pages also read.
 */

function revalidateCategoryPages() {
  revalidatePath("/app/budget-planner/categories");
  revalidatePath("/app/budget-planner/budget");
  revalidatePath("/app/budget-planner/income");
  revalidatePath("/app/budget-planner/expenses");
  revalidatePath("/app/budget-planner/transactions");
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
  const kind = formData.get("kind");

  const result = await createCategory(planId, {
    name: typeof name === "string" ? name : "",
    // Cast, not trusted blindly - `createCategory`'s own zod schema
    // re-validates this against the real enum; this only satisfies the
    // input type for a value the form's own `<Select>` already constrains.
    // Deliberately never sends `plannedAmountCents`/`group` - those stay
    // exclusive to the Budget page's own category form.
    kind: typeof kind === "string" && kind ? (kind as BudgetCategoryKind) : undefined,
  });

  if (result.status === "success") {
    revalidateCategoryPages();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

/**
 * Renames a category in place. `kind` is deliberately not editable here (or
 * anywhere on this page) - changing it after creation would orphan whatever
 * already references this category as income vs. expense, which is out of
 * scope for a simple identity-management page.
 */
export async function renameCategoryAction(categoryId: string, name: string): Promise<BudgetCategoryMutationResult> {
  const result = await updateCategory(categoryId, { name });
  if (result.status === "success") {
    revalidateCategoryPages();
  }
  return result;
}

export async function archiveCategoryAction(categoryId: string): Promise<DeleteBudgetCategoryResult> {
  const result = await archiveCategory(categoryId);
  if (result.status === "success") {
    revalidateCategoryPages();
  }
  return result;
}

export async function restoreCategoryAction(categoryId: string): Promise<DeleteBudgetCategoryResult> {
  const result = await restoreCategory(categoryId);
  if (result.status === "success") {
    revalidateCategoryPages();
  }
  return result;
}

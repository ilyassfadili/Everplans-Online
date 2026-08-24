"use server";

import { revalidatePath } from "next/cache";

import {
  createBudgetCategory,
  deleteBudgetCategory,
  updateBudgetCategory,
  type BudgetCategoryMutationResult,
  type UpdateBudgetCategoryInput,
} from "@/lib/wedding/budget-categories";
import { createExpense, deleteExpense, updateExpense, type ExpenseMutationResult, type UpdateExpenseInput } from "@/lib/wedding/expenses";
import { findOrCreateVendorByName } from "@/lib/wedding/vendors";

/**
 * The budget's own Server Actions - thin wrappers around
 * `@/lib/wedding/{budget-categories,expenses,vendors}`, colocated here
 * since only this one route mutates budget data (unlike tasks, nothing
 * else on the dashboard writes to it - the dashboard's own budget summary
 * is read-only, see `_components/budget-summary.tsx`).
 *
 * A raw vendor *name* typed into the expense form is resolved to a real
 * `wedding_vendors` row (`findOrCreateVendorByName`) here, at the action
 * boundary - `@/lib/wedding/expenses` itself only ever deals in an
 * already-resolved `vendorId`, never a name.
 */

const BUDGET_PATH = "/app/wedding-planner/budget";
const WEDDING_PLANNER_PATH = "/app/wedding-planner";

function revalidateBudget() {
  revalidatePath(BUDGET_PATH);
  revalidatePath(WEDDING_PLANNER_PATH);
}

export interface CreateCategoryFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createCategoryFormAction(
  weddingId: string,
  _prevState: CreateCategoryFormState,
  formData: FormData,
): Promise<CreateCategoryFormState> {
  const name = formData.get("name");
  const plannedAmount = formData.get("plannedAmountCents");

  const result = await createBudgetCategory(weddingId, {
    name: typeof name === "string" ? name : "",
    plannedAmountCents: typeof plannedAmount === "string" ? plannedAmount : undefined,
  });

  if (result.status === "success") {
    revalidateBudget();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editCategoryAction(
  categoryId: string,
  input: UpdateBudgetCategoryInput,
): Promise<BudgetCategoryMutationResult> {
  const result = await updateBudgetCategory(categoryId, input);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export async function removeCategoryAction(categoryId: string): Promise<void> {
  await deleteBudgetCategory(categoryId);
  revalidateBudget();
}

export interface CreateExpenseFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createExpenseFormAction(
  weddingId: string,
  _prevState: CreateExpenseFormState,
  formData: FormData,
): Promise<CreateExpenseFormState> {
  const title = formData.get("title");
  const amount = formData.get("amountCents");
  const expenseDate = formData.get("expenseDate");
  const categoryId = formData.get("categoryId");
  const vendorName = formData.get("vendorName");

  const vendor =
    typeof vendorName === "string" && vendorName.trim() ? await findOrCreateVendorByName(weddingId, vendorName) : null;

  const result = await createExpense(weddingId, {
    title: typeof title === "string" ? title : "",
    amountCents: typeof amount === "string" ? amount : "",
    expenseDate: typeof expenseDate === "string" ? expenseDate : "",
    categoryId: typeof categoryId === "string" ? categoryId : undefined,
    vendorId: vendor?.id,
  });

  if (result.status === "success") {
    revalidateBudget();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

/**
 * The expense edit form's save handler - resolves a raw vendor name the
 * same way creation does, then applies the patch. `vendorName` undefined
 * means "leave the vendor as-is"; an empty string means "clear it".
 */
export async function editExpenseAction(
  weddingId: string,
  expenseId: string,
  input: Omit<UpdateExpenseInput, "vendorId"> & { vendorName?: string },
): Promise<ExpenseMutationResult> {
  const { vendorName, ...rest } = input;

  // Built as a conditionally-spread key, not a possibly-`undefined`
  // property - `updateExpense` distinguishes "omitted" from "explicitly
  // cleared" by checking `Object.hasOwn` on its raw input (see its own
  // comment), so `{ ...rest, vendorId: undefined }` would be
  // indistinguishable from "clear the vendor" even when `vendorName` was
  // never touched.
  const vendorPatch: { vendorId?: string } = {};
  if (vendorName !== undefined) {
    const vendor = vendorName.trim() ? await findOrCreateVendorByName(weddingId, vendorName) : null;
    vendorPatch.vendorId = vendor?.id ?? "";
  }

  const result = await updateExpense(expenseId, { ...rest, ...vendorPatch });
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export async function removeExpenseAction(expenseId: string): Promise<void> {
  await deleteExpense(expenseId);
  revalidateBudget();
}

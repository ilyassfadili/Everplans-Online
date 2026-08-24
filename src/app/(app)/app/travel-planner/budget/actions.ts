"use server";

import { revalidatePath } from "next/cache";

import {
  createBudgetCategory,
  deleteBudgetCategory,
  updateBudgetCategory,
  type BudgetCategoryMutationResult,
  type CreateBudgetCategoryInput,
  type DeleteBudgetCategoryResult,
  type UpdateBudgetCategoryInput,
} from "@/lib/travel/budget-categories";
import {
  createExpense,
  deleteExpense,
  updateExpense,
  type DeleteExpenseResult,
  type ExpenseMutationResult,
  type UpdateExpenseInput,
} from "@/lib/travel/expenses";
import { updateTripTotalBudget } from "@/lib/travel/trips";
import type { TripMutationResult } from "@/lib/travel/trips";

/**
 * The Budget page's own Server Actions - thin wrappers around
 * `@/lib/travel/budget` and `@/lib/travel/trips`, following the same split
 * every other mutation in this codebase uses. Every successful mutation
 * revalidates this page and the dashboard, the same `revalidateItinerary`-style
 * pattern `itinerary/actions.ts` already establishes.
 */

const BUDGET_PATH = "/app/travel-planner/budget";
const DASHBOARD_PATH = "/app/travel-planner";

function revalidateBudget() {
  revalidatePath(BUDGET_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function updateTotalBudgetAction(tripId: string, totalBudget: string): Promise<TripMutationResult> {
  const result = await updateTripTotalBudget(tripId, totalBudget);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export async function createBudgetCategoryAction(tripId: string, input: CreateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
  const result = await createBudgetCategory(tripId, input);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export async function updateBudgetCategoryAction(
  categoryId: string,
  input: UpdateBudgetCategoryInput,
): Promise<BudgetCategoryMutationResult> {
  const result = await updateBudgetCategory(categoryId, input);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export async function deleteBudgetCategoryAction(categoryId: string): Promise<DeleteBudgetCategoryResult> {
  const result = await deleteBudgetCategory(categoryId);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export interface CreateExpenseFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/**
 * The expense quick-add form's own `useActionState`-shaped action - bound
 * to `tripId` at the call site (`AddExpenseForm`'s own `.bind(null,
 * tripId)`), the same shape `createExpenseFormAction` (Wedding Planner)
 * already establishes, distinct from the other actions here (which are
 * plain functions called directly with real arguments, not bound to
 * `FormData`) because this one really is a `<form action>`.
 */
export async function createExpenseFormAction(
  tripId: string,
  _prevState: CreateExpenseFormState,
  formData: FormData,
): Promise<CreateExpenseFormState> {
  const title = formData.get("title");
  const amountCents = formData.get("amountCents");
  const expenseDate = formData.get("expenseDate");
  const categoryId = formData.get("categoryId");

  const result = await createExpense(tripId, {
    title: typeof title === "string" ? title : "",
    amountCents: typeof amountCents === "string" ? amountCents : "",
    expenseDate: typeof expenseDate === "string" ? expenseDate : "",
    categoryId: typeof categoryId === "string" ? categoryId : undefined,
  });

  if (result.status === "success") {
    revalidateBudget();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function updateExpenseAction(expenseId: string, input: UpdateExpenseInput): Promise<ExpenseMutationResult> {
  const result = await updateExpense(expenseId, input);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

export async function deleteExpenseAction(expenseId: string): Promise<DeleteExpenseResult> {
  const result = await deleteExpense(expenseId);
  if (result.status === "success") {
    revalidateBudget();
  }
  return result;
}

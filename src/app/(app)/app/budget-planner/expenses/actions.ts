"use server";

import { revalidatePath } from "next/cache";

import {
  createExpense,
  deleteExpense,
  updateExpense,
  type CreateExpenseInput,
  type ExpenseMutationResult,
  type UpdateExpenseInput,
} from "@/lib/budget/expenses";

const EXPENSES_PATH = "/app/budget-planner/expenses";
const BUDGET_PATH = "/app/budget-planner/budget";
const BUDGET_PLANNER_PATH = "/app/budget-planner";

function revalidateExpenses() {
  revalidatePath(EXPENSES_PATH);
  revalidatePath(BUDGET_PATH);
  revalidatePath(BUDGET_PLANNER_PATH);
}

export interface CreateExpenseFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createExpenseFormAction(
  planId: string,
  _prevState: CreateExpenseFormState,
  formData: FormData,
): Promise<CreateExpenseFormState> {
  const title = formData.get("title");
  const amountCents = formData.get("amountCents");
  const expenseDate = formData.get("expenseDate");
  const categoryId = formData.get("categoryId");
  const accountId = formData.get("accountId");
  const note = formData.get("note");

  const input: CreateExpenseInput = {
    title: typeof title === "string" ? title : "",
    amountCents: typeof amountCents === "string" ? amountCents : "",
    expenseDate: typeof expenseDate === "string" ? expenseDate : "",
    categoryId: typeof categoryId === "string" ? categoryId : undefined,
    accountId: typeof accountId === "string" ? accountId : undefined,
    note: typeof note === "string" ? note : undefined,
  };

  const result = await createExpense(planId, input);

  if (result.status === "success") {
    revalidateExpenses();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editExpenseAction(expenseId: string, input: UpdateExpenseInput): Promise<ExpenseMutationResult> {
  const result = await updateExpense(expenseId, input);
  if (result.status === "success") {
    revalidateExpenses();
  }
  return result;
}

export async function removeExpenseAction(expenseId: string): Promise<void> {
  await deleteExpense(expenseId);
  revalidateExpenses();
}

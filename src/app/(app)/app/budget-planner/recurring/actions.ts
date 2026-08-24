"use server";

import { revalidatePath } from "next/cache";

import {
  createRecurringItem,
  deleteRecurringItem,
  updateRecurringItem,
  type CreateRecurringItemInput,
  type RecurringItemMutationResult,
  type UpdateRecurringItemInput,
} from "@/lib/budget/recurring";
import type { BudgetRecurringItem } from "@/types/budget";

const RECURRING_PATH = "/app/budget-planner/recurring";
const BUDGET_PLANNER_PATH = "/app/budget-planner";

function revalidateRecurring() {
  revalidatePath(RECURRING_PATH);
  revalidatePath(BUDGET_PLANNER_PATH);
}

export interface CreateRecurringItemFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createRecurringItemFormAction(
  planId: string,
  _prevState: CreateRecurringItemFormState,
  formData: FormData,
): Promise<CreateRecurringItemFormState> {
  const type = formData.get("type");
  const name = formData.get("name");
  const amountCents = formData.get("amountCents");
  const frequency = formData.get("frequency");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const categoryId = formData.get("categoryId");
  const notes = formData.get("notes");

  const input: CreateRecurringItemInput = {
    type: typeof type === "string" ? (type as CreateRecurringItemInput["type"]) : "expense",
    name: typeof name === "string" ? name : "",
    amountCents: typeof amountCents === "string" ? amountCents : "",
    frequency: typeof frequency === "string" ? (frequency as CreateRecurringItemInput["frequency"]) : undefined,
    startDate: typeof startDate === "string" ? startDate : "",
    endDate: typeof endDate === "string" ? endDate : undefined,
    categoryId: typeof categoryId === "string" ? categoryId : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  };

  const result = await createRecurringItem(planId, input);

  if (result.status === "success") {
    revalidateRecurring();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editRecurringItemAction(
  recurringItemId: string,
  currentItem: Pick<BudgetRecurringItem, "startDate" | "frequency" | "endDate">,
  input: UpdateRecurringItemInput,
): Promise<RecurringItemMutationResult> {
  const result = await updateRecurringItem(recurringItemId, currentItem, input);
  if (result.status === "success") {
    revalidateRecurring();
  }
  return result;
}

export async function toggleRecurringItemActiveAction(
  recurringItemId: string,
  currentItem: Pick<BudgetRecurringItem, "startDate" | "frequency" | "endDate">,
  isActive: boolean,
): Promise<RecurringItemMutationResult> {
  const result = await updateRecurringItem(recurringItemId, currentItem, { isActive });
  if (result.status === "success") {
    revalidateRecurring();
  }
  return result;
}

export async function removeRecurringItemAction(recurringItemId: string): Promise<void> {
  await deleteRecurringItem(recurringItemId);
  revalidateRecurring();
}

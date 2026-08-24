"use server";

import { revalidatePath } from "next/cache";

import {
  createIncomeEntry,
  deleteIncomeEntry,
  updateIncomeEntry,
  type CreateIncomeEntryInput,
  type IncomeEntryMutationResult,
  type UpdateIncomeEntryInput,
} from "@/lib/budget/income-entries";
import {
  createIncomeSource,
  deleteIncomeSource,
  updateIncomeSource,
  type IncomeSourceMutationResult,
  type UpdateIncomeSourceInput,
} from "@/lib/budget/income-sources";
import type { BudgetIncomeFrequency } from "@/types/budget";

const INCOME_PATH = "/app/budget-planner/income";
const BUDGET_PLANNER_PATH = "/app/budget-planner";

function revalidateIncome() {
  revalidatePath(INCOME_PATH);
  revalidatePath(BUDGET_PLANNER_PATH);
}

export interface CreateIncomeSourceFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createIncomeSourceFormAction(
  planId: string,
  _prevState: CreateIncomeSourceFormState,
  formData: FormData,
): Promise<CreateIncomeSourceFormState> {
  const name = formData.get("name");
  const amountCents = formData.get("amountCents");
  const frequency = formData.get("frequency");
  const notes = formData.get("notes");

  const result = await createIncomeSource(planId, {
    name: typeof name === "string" ? name : "",
    amountCents: typeof amountCents === "string" ? amountCents : "",
    // Cast, not trusted blindly - `createIncomeSource`'s own zod schema
    // re-validates this against the real enum.
    frequency: typeof frequency === "string" ? (frequency as BudgetIncomeFrequency) : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  if (result.status === "success") {
    revalidateIncome();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editIncomeSourceAction(
  incomeSourceId: string,
  input: UpdateIncomeSourceInput,
): Promise<IncomeSourceMutationResult> {
  const result = await updateIncomeSource(incomeSourceId, input);
  if (result.status === "success") {
    revalidateIncome();
  }
  return result;
}

export async function toggleIncomeSourceActiveAction(incomeSourceId: string, isActive: boolean): Promise<IncomeSourceMutationResult> {
  const result = await updateIncomeSource(incomeSourceId, { isActive });
  if (result.status === "success") {
    revalidateIncome();
  }
  return result;
}

export async function removeIncomeSourceAction(incomeSourceId: string): Promise<void> {
  await deleteIncomeSource(incomeSourceId);
  revalidateIncome();
}

// --- Income entries (actual, dated income received - Everplans Money Prompt 2) ---
// Deliberately separate action set from the income-*source* actions above:
// same file, same `revalidateIncome()` (both read from the same page and the
// dashboard), but a different underlying table/lib (`@/lib/budget/income-entries`)
// entirely. Mirrors `expenses/actions.ts`'s own split between a form-action
// creator (`useActionState`-compatible) and plain async functions for
// edit/delete that a row calls directly.

export interface CreateIncomeEntryFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createIncomeEntryFormAction(
  planId: string,
  _prevState: CreateIncomeEntryFormState,
  formData: FormData,
): Promise<CreateIncomeEntryFormState> {
  const title = formData.get("title");
  const amountCents = formData.get("amountCents");
  const entryDate = formData.get("entryDate");
  const categoryId = formData.get("categoryId");
  const accountId = formData.get("accountId");
  const note = formData.get("note");

  const input: CreateIncomeEntryInput = {
    title: typeof title === "string" ? title : "",
    amountCents: typeof amountCents === "string" ? amountCents : "",
    entryDate: typeof entryDate === "string" ? entryDate : "",
    categoryId: typeof categoryId === "string" ? categoryId : undefined,
    accountId: typeof accountId === "string" ? accountId : undefined,
    note: typeof note === "string" ? note : undefined,
  };

  const result = await createIncomeEntry(planId, input);

  if (result.status === "success") {
    revalidateIncome();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editIncomeEntryAction(entryId: string, input: UpdateIncomeEntryInput): Promise<IncomeEntryMutationResult> {
  const result = await updateIncomeEntry(entryId, input);
  if (result.status === "success") {
    revalidateIncome();
  }
  return result;
}

export async function removeIncomeEntryAction(entryId: string): Promise<void> {
  await deleteIncomeEntry(entryId);
  revalidateIncome();
}

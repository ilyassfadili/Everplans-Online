"use server";

import { revalidatePath } from "next/cache";

import {
  archiveAccount,
  createAccount,
  restoreAccount,
  updateAccount,
  type BudgetAccountMutationResult,
  type UpdateBudgetAccountInput,
} from "@/lib/budget/accounts";
import type { BudgetAccountType } from "@/types/budget";

/**
 * The Accounts page's own Server Actions - thin wrappers around
 * `@/lib/budget/accounts`, the same colocation `budget/actions.ts` uses for
 * categories. Every mutation revalidates this page plus Income/Expenses/
 * Transactions - all three read the accounts list to populate their own
 * account pickers.
 */

const ACCOUNTS_PATH = "/app/budget-planner/accounts";
const INCOME_PATH = "/app/budget-planner/income";
const EXPENSES_PATH = "/app/budget-planner/expenses";
const TRANSACTIONS_PATH = "/app/budget-planner/transactions";

function revalidateAccounts() {
  revalidatePath(ACCOUNTS_PATH);
  revalidatePath(INCOME_PATH);
  revalidatePath(EXPENSES_PATH);
  revalidatePath(TRANSACTIONS_PATH);
}

export interface CreateAccountFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createAccountFormAction(
  planId: string,
  _prevState: CreateAccountFormState,
  formData: FormData,
): Promise<CreateAccountFormState> {
  const name = formData.get("name");
  const type = formData.get("type");

  const result = await createAccount(planId, {
    name: typeof name === "string" ? name : "",
    // Cast, not trusted blindly - `createAccount`'s own zod schema
    // re-validates this against the real enum; this only satisfies the
    // input type for a value the form's own `<Select>` already constrains.
    type: typeof type === "string" && type ? (type as BudgetAccountType) : undefined,
  });

  if (result.status === "success") {
    revalidateAccounts();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editAccountAction(accountId: string, input: UpdateBudgetAccountInput): Promise<BudgetAccountMutationResult> {
  const result = await updateAccount(accountId, input);
  if (result.status === "success") {
    revalidateAccounts();
  }
  return result;
}

export async function removeAccountAction(accountId: string): Promise<void> {
  await archiveAccount(accountId);
  revalidateAccounts();
}

export async function restoreAccountAction(accountId: string): Promise<void> {
  await restoreAccount(accountId);
  revalidateAccounts();
}

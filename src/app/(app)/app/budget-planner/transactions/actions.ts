"use server";

import { revalidatePath } from "next/cache";

import { deleteExpense, updateExpense, type ExpenseMutationResult } from "@/lib/budget/expenses";
import { deleteIncomeEntry, updateIncomeEntry, type IncomeEntryMutationResult } from "@/lib/budget/income-entries";
import type { BudgetTransaction } from "@/types/budget";

/**
 * Thin server-action wrappers around `updateExpense`/`deleteExpense` and
 * `updateIncomeEntry`/`deleteIncomeEntry` - the unified Transactions view's
 * own dispatch layer (Everplans Money Prompt 2 Phase 4). A `BudgetTransaction`
 * is a read-time merge (`@/lib/budget/transactions`), never its own table, so
 * every mutation here has to branch on `transaction.type` and call back into
 * whichever real table (`budget_expenses` / `budget_income_entries`) actually
 * owns that row - same convention `expenses/actions.ts` and `income/actions.ts`
 * each already follow for their own single table.
 */

const TRANSACTIONS_PATH = "/app/budget-planner/transactions";
const BUDGET_PLANNER_PATH = "/app/budget-planner";
const EXPENSES_PATH = "/app/budget-planner/expenses";
const INCOME_PATH = "/app/budget-planner/income";

function revalidateTransactions(type: BudgetTransaction["type"]) {
  revalidatePath(TRANSACTIONS_PATH);
  revalidatePath(BUDGET_PLANNER_PATH);
  revalidatePath(type === "expense" ? EXPENSES_PATH : INCOME_PATH);
}

/**
 * One shared shape the row's edit form fills in, regardless of which table
 * it ultimately targets - `date` stands in for `expenseDate`/`entryDate`
 * (the one field name that actually differs between the two), mapped back
 * to the real column name below. Every key is optional/raw-string, matching
 * `UpdateExpenseInput`/`UpdateIncomeEntryInput`'s own "only what the row's
 * edit form actually renders" convention.
 */
export interface UpdateTransactionInput {
  title?: string;
  amountCents?: string;
  date?: string;
  categoryId?: string;
  accountId?: string;
}

export async function editTransactionAction(
  id: string,
  type: BudgetTransaction["type"],
  input: UpdateTransactionInput,
): Promise<ExpenseMutationResult | IncomeEntryMutationResult> {
  const result =
    type === "expense"
      ? await updateExpense(id, {
          title: input.title,
          amountCents: input.amountCents,
          expenseDate: input.date,
          categoryId: input.categoryId,
          accountId: input.accountId,
        })
      : await updateIncomeEntry(id, {
          title: input.title,
          amountCents: input.amountCents,
          entryDate: input.date,
          categoryId: input.categoryId,
          accountId: input.accountId,
        });

  if (result.status === "success") {
    revalidateTransactions(type);
  }
  return result;
}

export async function removeTransactionAction(id: string, type: BudgetTransaction["type"]): Promise<void> {
  if (type === "expense") {
    await deleteExpense(id);
  } else {
    await deleteIncomeEntry(id);
  }
  revalidateTransactions(type);
}

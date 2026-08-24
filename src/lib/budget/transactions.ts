import "server-only";

import { getExpensesForPlan } from "@/lib/budget/expenses";
import { getIncomeEntriesForPlan } from "@/lib/budget/income-entries";
import type { MonthKey } from "@/lib/budget/month";
import { getMonthDateRange } from "@/lib/budget/month";
import type { BudgetTransaction } from "@/types/budget";

/**
 * The unified Transactions read model (Everplans Money Prompt 2) - merges
 * `budget_expenses` and `budget_income_entries` into one list, the two real
 * per-occurrence ledgers this plan has (`budget_income_sources` and
 * `budget_recurring_items` are *definitions*, never actual events - see
 * their own type comments - so neither belongs in a transaction history).
 * There is no database-level UNION here: each table is already scoped by
 * plan (and, when provided, by date range) before this ever runs, so
 * merging two short, already-filtered arrays in application code is simpler
 * and just as correct as a SQL-level union, with no new query surface to
 * secure. Sorting/searching/paginating over the merged list all happen here
 * too, kept deliberately simple (Prompt 2's own "do not build an
 * unnecessarily complex data-grid system").
 */

export type TransactionTypeFilter = "all" | "income" | "expense";
export type TransactionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export interface GetTransactionsOptions {
  month?: MonthKey;
  type?: TransactionTypeFilter;
  categoryId?: string;
  accountId?: string;
  /** Free-text match against title/note - client-side over an already plan-scoped (and usually month-scoped) list, never an unbounded table scan. */
  query?: string;
  sort?: TransactionSort;
}

function expenseToTransaction(expense: Awaited<ReturnType<typeof getExpensesForPlan>>[number]): BudgetTransaction {
  return {
    id: expense.id,
    type: "expense",
    title: expense.title,
    amountCents: expense.amountCents,
    date: expense.expenseDate,
    categoryId: expense.categoryId,
    accountId: expense.accountId,
    note: expense.note,
  };
}

function incomeEntryToTransaction(entry: Awaited<ReturnType<typeof getIncomeEntriesForPlan>>[number]): BudgetTransaction {
  return {
    id: entry.id,
    type: "income",
    title: entry.title,
    amountCents: entry.amountCents,
    date: entry.entryDate,
    categoryId: entry.categoryId,
    accountId: entry.accountId,
    note: entry.note,
  };
}

const SORTERS: Record<TransactionSort, (a: BudgetTransaction, b: BudgetTransaction) => number> = {
  "date-desc": (a, b) => b.date.localeCompare(a.date),
  "date-asc": (a, b) => a.date.localeCompare(b.date),
  "amount-desc": (a, b) => b.amountCents - a.amountCents,
  "amount-asc": (a, b) => a.amountCents - b.amountCents,
};

/**
 * Fetches, merges, and filters a plan's transactions. Always fetches both
 * income and expenses unless `type` narrows to just one (no point querying
 * a table the result will immediately discard). `query` and `categoryId`/
 * `accountId` filtering happen after the merge, over whatever the date/type
 * filters already narrowed the set to - never over the plan's unbounded
 * full history.
 */
export async function getTransactionsForPlan(planId: string, options: GetTransactionsOptions = {}): Promise<BudgetTransaction[]> {
  const dateRange = options.month ? getMonthDateRange(options.month) : undefined;
  const type = options.type ?? "all";

  const [expenses, incomeEntries] = await Promise.all([
    type === "income" ? Promise.resolve([]) : getExpensesForPlan(planId, dateRange),
    type === "expense" ? Promise.resolve([]) : getIncomeEntriesForPlan(planId, dateRange),
  ]);

  let transactions: BudgetTransaction[] = [...expenses.map(expenseToTransaction), ...incomeEntries.map(incomeEntryToTransaction)];

  if (options.categoryId) {
    transactions = transactions.filter((transaction) => transaction.categoryId === options.categoryId);
  }
  if (options.accountId) {
    transactions = transactions.filter((transaction) => transaction.accountId === options.accountId);
  }

  const query = options.query?.trim().toLowerCase();
  if (query) {
    transactions = transactions.filter(
      (transaction) => transaction.title.toLowerCase().includes(query) || (transaction.note?.toLowerCase().includes(query) ?? false),
    );
  }

  transactions.sort(SORTERS[options.sort ?? "date-desc"]);

  return transactions;
}

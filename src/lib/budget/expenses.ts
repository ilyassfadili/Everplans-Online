import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { parseAmountToCents } from "@/lib/budget/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetExpense } from "@/types/budget";

/**
 * Budget Planner expenses - `public.budget_expenses`. Same shape as
 * `@/lib/wedding/expenses`: every function calls `requireUser()` itself, and
 * RLS (a join back to `budget_plans.owner_id`) independently enforces the
 * same "only this plan's owner" boundary. `categoryId` is a plain foreign-key
 * reference - never a category name duplicated onto the expense row itself.
 */

const EXPENSE_COLUMNS =
  "id, plan_id, category_id, recurring_item_id, account_id, title, amount_cents, expense_date, note, created_at, updated_at";

type ExpenseRow = {
  id: string;
  plan_id: string;
  category_id: string | null;
  recurring_item_id: string | null;
  account_id: string | null;
  title: string;
  amount_cents: number;
  expense_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function mapExpenseRow(row: ExpenseRow): BudgetExpense {
  return {
    id: row.id,
    planId: row.plan_id,
    categoryId: row.category_id,
    recurringItemId: row.recurring_item_id,
    accountId: row.account_id,
    title: row.title,
    amountCents: row.amount_cents,
    expenseDate: row.expense_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * All of a plan's expenses, most recent first - the budget page's own
 * grouping/sorting happens over this full list. `dateRange` narrows to a
 * specific inclusive `[start, end]` window (`YYYY-MM-DD`) - the Money
 * Overview and Transactions view both pass one (`@/lib/budget/month.ts`'s
 * `getMonthDateRange`) so "this month" actually means this month; omit it
 * for a view that genuinely wants the plan's entire history, like Budget's
 * planned-vs-actual.
 */
export async function getExpensesForPlan(planId: string, dateRange?: { start: string; end: string }): Promise<BudgetExpense[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("budget_expenses").select(EXPENSE_COLUMNS).eq("plan_id", planId);
  if (dateRange) {
    query = query.gte("expense_date", dateRange.start).lte("expense_date", dateRange.end);
  }

  const { data, error } = await query.order("expense_date", { ascending: false });

  if (error) {
    console.error("getExpensesForPlan: failed to load expenses", error);
    return [];
  }

  return (data ?? []).map(mapExpenseRow);
}

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const expenseFieldsSchema = {
  title: z.string().trim().min(1, "What was it?").max(150, "Keep it under 150 characters."),
  amountCents: z
    .string()
    .trim()
    .transform((value) => parseAmountToCents(value))
    .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative.")),
  expenseDate: z.string().trim().min(1, "Choose a date."),
  categoryId: optionalIdSchema,
  accountId: optionalIdSchema,
  note: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
};

const createExpenseSchema = z.object({
  title: expenseFieldsSchema.title,
  amountCents: expenseFieldsSchema.amountCents,
  expenseDate: expenseFieldsSchema.expenseDate,
  categoryId: expenseFieldsSchema.categoryId,
  accountId: expenseFieldsSchema.accountId,
  note: expenseFieldsSchema.note,
});

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;

export type ExpenseMutationResult =
  | { status: "success"; expense: BudgetExpense }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createExpense(planId: string, input: CreateExpenseInput): Promise<ExpenseMutationResult> {
  await requireUser();

  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_expenses")
    .insert({
      plan_id: planId,
      category_id: parsed.data.categoryId,
      account_id: parsed.data.accountId,
      title: parsed.data.title,
      amount_cents: parsed.data.amountCents,
      expense_date: parsed.data.expenseDate,
      note: parsed.data.note,
    })
    .select(EXPENSE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createExpense: failed to create expense", error);
    return { status: "error", message: "Couldn't add that expense. Please try again." };
  }

  return { status: "success", expense: mapExpenseRow(data) };
}

const updateExpenseSchema = z.object({
  title: expenseFieldsSchema.title.optional(),
  amountCents: expenseFieldsSchema.amountCents.optional(),
  expenseDate: expenseFieldsSchema.expenseDate.optional(),
  categoryId: expenseFieldsSchema.categoryId,
  accountId: expenseFieldsSchema.accountId,
  note: expenseFieldsSchema.note,
});

export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;

export async function updateExpense(expenseId: string, input: UpdateExpenseInput): Promise<ExpenseMutationResult> {
  await requireUser();

  const parsed = updateExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    title?: string;
    amount_cents?: number;
    expense_date?: string;
    category_id?: string | null;
    account_id?: string | null;
    note?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.amountCents !== undefined) patch.amount_cents = parsed.data.amountCents;
  if (parsed.data.expenseDate !== undefined) patch.expense_date = parsed.data.expenseDate;
  // `categoryId`/`accountId`/`note` all transform `undefined -> null` even
  // when absent - checking presence on the raw `input` is what makes "leave
  // this alone" and "clear it" distinguishable, same fix as `updateExpense`
  // (Wedding).
  if (Object.hasOwn(input, "categoryId")) patch.category_id = parsed.data.categoryId;
  if (Object.hasOwn(input, "accountId")) patch.account_id = parsed.data.accountId;
  if (Object.hasOwn(input, "note")) patch.note = parsed.data.note;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_expenses")
    .update(patch)
    .eq("id", expenseId)
    .select(EXPENSE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateExpense: failed to update expense", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", expense: mapExpenseRow(data) };
}

export type DeleteExpenseResult = { status: "success" } | { status: "error"; message: string };

export async function deleteExpense(expenseId: string): Promise<DeleteExpenseResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_expenses").delete().eq("id", expenseId);

  if (error) {
    console.error("deleteExpense: failed to delete expense", error);
    return { status: "error", message: "Couldn't remove that expense. Please try again." };
  }

  return { status: "success" };
}

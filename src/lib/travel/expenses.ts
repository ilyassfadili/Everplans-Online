import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TripExpense } from "@/types/travel";

import { parseAmountToCents } from "./currency";

/**
 * Travel Planner expenses (Prompt 3 Phase 2) - `public.trip_expenses`.
 * Same shape as `@/lib/wedding/expenses`: every function calls
 * `requireUser()` itself, and RLS (a join back to `trips.owner_id`)
 * independently enforces "only this trip's owner." `categoryId` is
 * already a resolved id by the time these are called - never a category
 * name.
 */

const EXPENSE_COLUMNS = "id, trip_id, category_id, title, amount_cents, expense_date, notes, created_at, updated_at";

type ExpenseRow = {
  id: string;
  trip_id: string;
  category_id: string | null;
  title: string;
  amount_cents: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapExpenseRow(row: ExpenseRow): TripExpense {
  return {
    id: row.id,
    tripId: row.trip_id,
    categoryId: row.category_id,
    title: row.title,
    amountCents: row.amount_cents,
    expenseDate: row.expense_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** All of a trip's expenses, most recent first - the budget page's own grouping/sorting happens over this full list. */
export async function getExpensesForTrip(tripId: string): Promise<TripExpense[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_expenses")
    .select(EXPENSE_COLUMNS)
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false });

  if (error) {
    console.error("getExpensesForTrip: failed to load expenses", error);
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
  notes: z
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
  notes: expenseFieldsSchema.notes,
});

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;

export type ExpenseMutationResult =
  | { status: "success"; expense: TripExpense }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Adds an expense - "what was it / how much / when / which category" (Phase 2's own essential fields). */
export async function createExpense(tripId: string, input: CreateExpenseInput): Promise<ExpenseMutationResult> {
  await requireUser();

  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_expenses")
    .insert({
      trip_id: tripId,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      amount_cents: parsed.data.amountCents,
      expense_date: parsed.data.expenseDate,
      notes: parsed.data.notes,
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
  notes: expenseFieldsSchema.notes,
});

export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;

/** Edits an expense - only the fields actually present in `input` are written, the same partial-patch approach `updateExpense` (Wedding Planner) uses. */
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
    notes?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.amountCents !== undefined) patch.amount_cents = parsed.data.amountCents;
  if (parsed.data.expenseDate !== undefined) patch.expense_date = parsed.data.expenseDate;
  // `categoryId`/`notes` both use `.optional().transform(v => v ? v :
  // null)` - the transform runs even when the field is absent, so checking
  // presence on the raw `input` (not the parsed output) is what makes
  // "leave this alone" and "clear it" distinguishable, the same fix
  // `updateExpense` (Wedding Planner) applies.
  if (Object.hasOwn(input, "categoryId")) patch.category_id = parsed.data.categoryId;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_expenses")
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

  const { error } = await supabase.from("trip_expenses").delete().eq("id", expenseId);

  if (error) {
    console.error("deleteExpense: failed to delete expense", error);
    return { status: "error", message: "Couldn't remove that expense. Please try again." };
  }

  return { status: "success" };
}

import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAmountToCents } from "@/lib/wedding/currency";
import type { WeddingExpense } from "@/types/wedding";

/**
 * Wedding Planner expenses - `public.wedding_expenses`
 * (`supabase/migrations/20260826000000_wedding_budget.sql`). Same shape as
 * `@/lib/wedding/tasks`: every function calls `requireUser()` itself, and
 * RLS (a join back to `weddings.owner_id`) independently enforces the same
 * "only this wedding's owner" boundary. `categoryId`/`vendorId` are both
 * plain foreign-key references - never a vendor name or category name
 * duplicated onto the expense row itself.
 */

const EXPENSE_COLUMNS =
  "id, wedding_id, category_id, vendor_id, title, amount_cents, expense_date, note, created_at, updated_at";

type ExpenseRow = {
  id: string;
  wedding_id: string;
  category_id: string | null;
  vendor_id: string | null;
  title: string;
  amount_cents: number;
  expense_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function mapExpenseRow(row: ExpenseRow): WeddingExpense {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    categoryId: row.category_id,
    vendorId: row.vendor_id,
    title: row.title,
    amountCents: row.amount_cents,
    expenseDate: row.expense_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** All of a wedding's expenses, most recent first - the budget page's own grouping/sorting happens client-side over this full list. */
export async function getExpensesForWedding(weddingId: string): Promise<WeddingExpense[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_expenses")
    .select(EXPENSE_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("expense_date", { ascending: false });

  if (error) {
    console.error("getExpensesForWedding: failed to load expenses", error);
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
  vendorId: optionalIdSchema,
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
  vendorId: expenseFieldsSchema.vendorId,
  note: expenseFieldsSchema.note,
});

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;

export type ExpenseMutationResult =
  | { status: "success"; expense: WeddingExpense }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Adds an expense - "what was it / how much / when / which category"
 * (Phase 3's own four essential fields), plus the optional vendor link
 * (Phase 4). `categoryId`/`vendorId` are already-resolved ids by the time
 * this is called - vendor name resolution happens one layer up
 * (`@/lib/wedding/vendors`'s `findOrCreateVendorByName`), so this function
 * itself never touches vendor *names*, only the reference.
 */
export async function createExpense(weddingId: string, input: CreateExpenseInput): Promise<ExpenseMutationResult> {
  await requireUser();

  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_expenses")
    .insert({
      wedding_id: weddingId,
      category_id: parsed.data.categoryId,
      vendor_id: parsed.data.vendorId,
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
  vendorId: expenseFieldsSchema.vendorId,
  note: expenseFieldsSchema.note,
});

export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;

/** Edits an expense - only the fields actually present in `input` are written, the same partial-patch approach `updateTask` uses. */
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
    vendor_id?: string | null;
    note?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.amountCents !== undefined) patch.amount_cents = parsed.data.amountCents;
  if (parsed.data.expenseDate !== undefined) patch.expense_date = parsed.data.expenseDate;
  // `categoryId`/`vendorId`/`note` all use `.optional().transform(v => v
  // ? v : null)` - the transform runs even when the field is absent, so
  // checking presence on the raw `input` (not the parsed output) is what
  // makes "leave this alone" and "clear it" distinguishable - see
  // `updateTask`'s identical fix for the full explanation. Without this,
  // e.g. editing just an expense's amount would silently unlink its
  // category and vendor.
  if (Object.hasOwn(input, "categoryId")) patch.category_id = parsed.data.categoryId;
  if (Object.hasOwn(input, "vendorId")) patch.vendor_id = parsed.data.vendorId;
  if (Object.hasOwn(input, "note")) patch.note = parsed.data.note;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_expenses")
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

  const { error } = await supabase.from("wedding_expenses").delete().eq("id", expenseId);

  if (error) {
    console.error("deleteExpense: failed to delete expense", error);
    return { status: "error", message: "Couldn't remove that expense. Please try again." };
  }

  return { status: "success" };
}

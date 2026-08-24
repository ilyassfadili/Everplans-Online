import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { parseAmountToCents } from "@/lib/budget/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetIncomeEntry } from "@/types/budget";

/**
 * Actual income received - `public.budget_income_entries` (Everplans Money
 * Prompt 2's "Income page" requirement: dated, editable, deletable records,
 * which `budget_income_sources` - a recurring *definition* - can't
 * represent on its own; see that type's own comment). Same shape as
 * `@/lib/budget/expenses`: every function calls `requireUser()` itself, and
 * RLS (a join back to `budget_plans.owner_id`) independently enforces the
 * same "only this plan's owner" boundary. `categoryId`/`accountId`/`sourceId`
 * are plain foreign-key references - never duplicated names on the row itself.
 */

const INCOME_ENTRY_COLUMNS =
  "id, plan_id, source_id, category_id, account_id, title, amount_cents, entry_date, note, created_at, updated_at";

type IncomeEntryRow = {
  id: string;
  plan_id: string;
  source_id: string | null;
  category_id: string | null;
  account_id: string | null;
  title: string;
  amount_cents: number;
  entry_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function mapIncomeEntryRow(row: IncomeEntryRow): BudgetIncomeEntry {
  return {
    id: row.id,
    planId: row.plan_id,
    sourceId: row.source_id,
    categoryId: row.category_id,
    accountId: row.account_id,
    title: row.title,
    amountCents: row.amount_cents,
    entryDate: row.entry_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * All of a plan's recorded income, most recent first. `dateRange` narrows to
 * a specific inclusive `[start, end]` window (`YYYY-MM-DD`, see
 * `@/lib/budget/month.ts`'s `getMonthDateRange`) - the Income page, Money
 * Overview, and Transactions view all pass one so "this month" means this
 * month; omit it for a view that genuinely wants the plan's entire history.
 */
export async function getIncomeEntriesForPlan(planId: string, dateRange?: { start: string; end: string }): Promise<BudgetIncomeEntry[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("budget_income_entries").select(INCOME_ENTRY_COLUMNS).eq("plan_id", planId);
  if (dateRange) {
    query = query.gte("entry_date", dateRange.start).lte("entry_date", dateRange.end);
  }

  const { data, error } = await query.order("entry_date", { ascending: false });

  if (error) {
    console.error("getIncomeEntriesForPlan: failed to load income entries", error);
    return [];
  }

  return (data ?? []).map(mapIncomeEntryRow);
}

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const incomeEntryFieldsSchema = {
  title: z.string().trim().min(1, "Where did this come from?").max(150, "Keep it under 150 characters."),
  amountCents: z
    .string()
    .trim()
    .transform((value) => parseAmountToCents(value))
    .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative.")),
  entryDate: z.string().trim().min(1, "Choose a date."),
  categoryId: optionalIdSchema,
  accountId: optionalIdSchema,
  sourceId: optionalIdSchema,
  note: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
};

const createIncomeEntrySchema = z.object({
  title: incomeEntryFieldsSchema.title,
  amountCents: incomeEntryFieldsSchema.amountCents,
  entryDate: incomeEntryFieldsSchema.entryDate,
  categoryId: incomeEntryFieldsSchema.categoryId,
  accountId: incomeEntryFieldsSchema.accountId,
  sourceId: incomeEntryFieldsSchema.sourceId,
  note: incomeEntryFieldsSchema.note,
});

export type CreateIncomeEntryInput = z.input<typeof createIncomeEntrySchema>;

export type IncomeEntryMutationResult =
  | { status: "success"; entry: BudgetIncomeEntry }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createIncomeEntry(planId: string, input: CreateIncomeEntryInput): Promise<IncomeEntryMutationResult> {
  await requireUser();

  const parsed = createIncomeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_income_entries")
    .insert({
      plan_id: planId,
      category_id: parsed.data.categoryId,
      account_id: parsed.data.accountId,
      source_id: parsed.data.sourceId,
      title: parsed.data.title,
      amount_cents: parsed.data.amountCents,
      entry_date: parsed.data.entryDate,
      note: parsed.data.note,
    })
    .select(INCOME_ENTRY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createIncomeEntry: failed to create income entry", error);
    return { status: "error", message: "Couldn't add that income. Please try again." };
  }

  return { status: "success", entry: mapIncomeEntryRow(data) };
}

const updateIncomeEntrySchema = z.object({
  title: incomeEntryFieldsSchema.title.optional(),
  amountCents: incomeEntryFieldsSchema.amountCents.optional(),
  entryDate: incomeEntryFieldsSchema.entryDate.optional(),
  categoryId: incomeEntryFieldsSchema.categoryId,
  accountId: incomeEntryFieldsSchema.accountId,
  sourceId: incomeEntryFieldsSchema.sourceId,
  note: incomeEntryFieldsSchema.note,
});

export type UpdateIncomeEntryInput = z.input<typeof updateIncomeEntrySchema>;

export async function updateIncomeEntry(entryId: string, input: UpdateIncomeEntryInput): Promise<IncomeEntryMutationResult> {
  await requireUser();

  const parsed = updateIncomeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    title?: string;
    amount_cents?: number;
    entry_date?: string;
    category_id?: string | null;
    account_id?: string | null;
    source_id?: string | null;
    note?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.amountCents !== undefined) patch.amount_cents = parsed.data.amountCents;
  if (parsed.data.entryDate !== undefined) patch.entry_date = parsed.data.entryDate;
  // Every optional-id/`note` field transforms `undefined -> null` even when
  // absent - checking presence on the raw `input` is what makes "leave this
  // alone" and "clear it" distinguishable, same fix `updateExpense` applies.
  if (Object.hasOwn(input, "categoryId")) patch.category_id = parsed.data.categoryId;
  if (Object.hasOwn(input, "accountId")) patch.account_id = parsed.data.accountId;
  if (Object.hasOwn(input, "sourceId")) patch.source_id = parsed.data.sourceId;
  if (Object.hasOwn(input, "note")) patch.note = parsed.data.note;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_income_entries")
    .update(patch)
    .eq("id", entryId)
    .select(INCOME_ENTRY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateIncomeEntry: failed to update income entry", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", entry: mapIncomeEntryRow(data) };
}

export type DeleteIncomeEntryResult = { status: "success" } | { status: "error"; message: string };

export async function deleteIncomeEntry(entryId: string): Promise<DeleteIncomeEntryResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_income_entries").delete().eq("id", entryId);

  if (error) {
    console.error("deleteIncomeEntry: failed to delete income entry", error);
    return { status: "error", message: "Couldn't remove that income. Please try again." };
  }

  return { status: "success" };
}

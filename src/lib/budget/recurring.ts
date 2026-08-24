import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { parseAmountToCents } from "@/lib/budget/currency";
import { calculateNextOccurrence } from "@/lib/budget/recurring-occurrence";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetRecurringFrequency, BudgetRecurringItem, BudgetRecurringItemType } from "@/types/budget";

/**
 * Budget Planner recurring items - `public.budget_recurring_items`
 * (Prompt 4 Phase 1). A recurring item is a *definition* of something that
 * repeats, deliberately never itself an actual transaction - creating or
 * editing one here never writes a `budget_expenses` row, so a future
 * month's rent can never appear as money already spent (`BudgetRecurringItem`'s
 * own comment). `next_occurrence_date` is recomputed and persisted on every
 * create/edit as a convenient, roughly-fresh sort key, but nothing reads it
 * as authoritative - display always recomputes via
 * `@/lib/budget/recurring-occurrence`, which stays correct even for an item
 * nobody has touched in months.
 */

const RECURRING_ITEM_COLUMNS =
  "id, plan_id, type, name, amount_cents, category_id, account_id, frequency, start_date, end_date, next_occurrence_date, is_active, notes, created_at, updated_at";

type RecurringItemRow = {
  id: string;
  plan_id: string;
  type: string;
  name: string;
  amount_cents: number;
  category_id: string | null;
  account_id: string | null;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_occurrence_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapRecurringItemRow(row: RecurringItemRow): BudgetRecurringItem {
  return {
    id: row.id,
    planId: row.plan_id,
    // Cast, not re-validated: `budget_recurring_items_type_valid` /
    // `budget_recurring_items_frequency_valid` (the migration) already
    // guarantee the database can never hold anything outside these unions.
    type: row.type as BudgetRecurringItemType,
    name: row.name,
    amountCents: row.amount_cents,
    categoryId: row.category_id,
    // Not yet surfaced in the Recurring page's own UI (Everplans Money
    // Prompt 1's "Accounts foundation" scoped account-linking to
    // income/expenses, not recurring definitions) - always `null` today,
    // the same forward-declared-but-unused shape `recurring_item_id`
    // carried on `budget_expenses` before Prompt 4 started writing it.
    accountId: row.account_id,
    frequency: row.frequency as BudgetRecurringFrequency,
    startDate: row.start_date,
    endDate: row.end_date,
    nextOccurrenceDate: row.next_occurrence_date,
    isActive: row.is_active,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRecurringItemsForPlan(planId: string): Promise<BudgetRecurringItem[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_recurring_items")
    .select(RECURRING_ITEM_COLUMNS)
    .eq("plan_id", planId)
    .order("next_occurrence_date", { ascending: true });

  if (error) {
    console.error("getRecurringItemsForPlan: failed to load recurring items", error);
    return [];
  }

  return (data ?? []).map(mapRecurringItemRow);
}

const amountCentsSchema = z
  .string()
  .trim()
  .transform((value) => parseAmountToCents(value))
  .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative."));

const frequencySchema = z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]);
const typeSchema = z.enum(["income", "expense", "savings"]);

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const createRecurringItemSchema = z.object({
  type: typeSchema,
  name: z.string().trim().min(1, "Give this a name.").max(150, "Keep it under 150 characters."),
  amountCents: amountCentsSchema,
  frequency: frequencySchema.optional().default("monthly"),
  startDate: z.string().trim().min(1, "Choose a start date."),
  endDate: optionalDateSchema,
  categoryId: optionalIdSchema,
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type CreateRecurringItemInput = z.input<typeof createRecurringItemSchema>;

export type RecurringItemMutationResult =
  | { status: "success"; recurringItem: BudgetRecurringItem }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createRecurringItem(planId: string, input: CreateRecurringItemInput): Promise<RecurringItemMutationResult> {
  await requireUser();

  const parsed = createRecurringItemSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const nextOccurrenceDate = calculateNextOccurrence(parsed.data.startDate, parsed.data.frequency, parsed.data.endDate);

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_recurring_items")
    .insert({
      plan_id: planId,
      type: parsed.data.type,
      name: parsed.data.name,
      amount_cents: parsed.data.amountCents,
      frequency: parsed.data.frequency,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      category_id: parsed.data.type === "expense" ? parsed.data.categoryId : null,
      next_occurrence_date: nextOccurrenceDate,
      notes: parsed.data.notes,
    })
    .select(RECURRING_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createRecurringItem: failed to create recurring item", error);
    return { status: "error", message: "Couldn't add that recurring item. Please try again." };
  }

  return { status: "success", recurringItem: mapRecurringItemRow(data) };
}

const updateRecurringItemSchema = z.object({
  name: z.string().trim().min(1, "Give this a name.").max(150, "Keep it under 150 characters.").optional(),
  amountCents: amountCentsSchema.optional(),
  frequency: frequencySchema.optional(),
  startDate: z.string().trim().min(1).optional(),
  endDate: optionalDateSchema,
  categoryId: optionalIdSchema,
  isActive: z.boolean().optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type UpdateRecurringItemInput = z.input<typeof updateRecurringItemSchema>;

export async function updateRecurringItem(
  recurringItemId: string,
  currentItem: Pick<BudgetRecurringItem, "startDate" | "frequency" | "endDate">,
  input: UpdateRecurringItemInput,
): Promise<RecurringItemMutationResult> {
  await requireUser();

  const parsed = updateRecurringItemSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    amount_cents?: number;
    frequency?: BudgetRecurringFrequency;
    start_date?: string;
    end_date?: string | null;
    category_id?: string | null;
    is_active?: boolean;
    notes?: string | null;
    next_occurrence_date?: string | null;
  } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.amountCents !== undefined) patch.amount_cents = parsed.data.amountCents;
  if (parsed.data.frequency !== undefined) patch.frequency = parsed.data.frequency;
  if (parsed.data.startDate !== undefined) patch.start_date = parsed.data.startDate;
  if (Object.hasOwn(input, "endDate")) patch.end_date = parsed.data.endDate;
  if (Object.hasOwn(input, "categoryId")) patch.category_id = parsed.data.categoryId;
  if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  // Recompute the persisted "next occurrence" whenever anything that
  // affects it changed - a stale sort key would otherwise linger until the
  // next unrelated edit.
  if (patch.frequency !== undefined || patch.start_date !== undefined || Object.hasOwn(input, "endDate")) {
    patch.next_occurrence_date = calculateNextOccurrence(
      patch.start_date ?? currentItem.startDate,
      patch.frequency ?? currentItem.frequency,
      Object.hasOwn(input, "endDate") ? parsed.data.endDate : currentItem.endDate,
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_recurring_items")
    .update(patch)
    .eq("id", recurringItemId)
    .select(RECURRING_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateRecurringItem: failed to update recurring item", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", recurringItem: mapRecurringItemRow(data) };
}

export type DeleteRecurringItemResult = { status: "success" } | { status: "error"; message: string };

export async function deleteRecurringItem(recurringItemId: string): Promise<DeleteRecurringItemResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_recurring_items").delete().eq("id", recurringItemId);

  if (error) {
    console.error("deleteRecurringItem: failed to delete recurring item", error);
    return { status: "error", message: "Couldn't remove that recurring item. Please try again." };
  }

  return { status: "success" };
}

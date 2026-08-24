import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { parseAmountToCents } from "@/lib/budget/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetIncomeFrequency, BudgetIncomeSource } from "@/types/budget";

/**
 * Budget Planner income sources - `public.budget_income_sources`
 * (`supabase/migrations/20260901000000_budget_planner_foundation.sql`). Same
 * shape as `@/lib/wedding/budget-categories`: every function calls
 * `requireUser()` itself, and RLS (a join back to `budget_plans.owner_id`)
 * independently enforces the same "only this plan's owner" boundary.
 */

const INCOME_SOURCE_COLUMNS = "id, plan_id, name, amount_cents, frequency, is_active, notes, sort_order, created_at, updated_at";

type IncomeSourceRow = {
  id: string;
  plan_id: string;
  name: string;
  amount_cents: number;
  frequency: string;
  is_active: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapIncomeSourceRow(row: IncomeSourceRow): BudgetIncomeSource {
  return {
    id: row.id,
    planId: row.plan_id,
    name: row.name,
    amountCents: row.amount_cents,
    // Cast, not re-validated: `budget_income_sources_frequency_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    frequency: row.frequency as BudgetIncomeFrequency,
    isActive: row.is_active,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getIncomeSourcesForPlan(planId: string): Promise<BudgetIncomeSource[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_income_sources")
    .select(INCOME_SOURCE_COLUMNS)
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getIncomeSourcesForPlan: failed to load income sources", error);
    return [];
  }

  return (data ?? []).map(mapIncomeSourceRow);
}

const amountCentsSchema = z
  .string()
  .trim()
  .transform((value) => parseAmountToCents(value))
  .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative."));

const frequencySchema = z.enum(["weekly", "biweekly", "monthly", "yearly", "one-time"]);

const createIncomeSourceSchema = z.object({
  name: z.string().trim().min(1, "Give this income a name.").max(100, "Keep it under 100 characters."),
  amountCents: amountCentsSchema,
  frequency: frequencySchema.optional().default("monthly"),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type CreateIncomeSourceInput = z.input<typeof createIncomeSourceSchema>;

export type IncomeSourceMutationResult =
  | { status: "success"; incomeSource: BudgetIncomeSource }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createIncomeSource(planId: string, input: CreateIncomeSourceInput): Promise<IncomeSourceMutationResult> {
  await requireUser();

  const parsed = createIncomeSourceSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("budget_income_sources")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  const { data, error } = await supabase
    .from("budget_income_sources")
    .insert({
      plan_id: planId,
      name: parsed.data.name,
      amount_cents: parsed.data.amountCents,
      frequency: parsed.data.frequency,
      notes: parsed.data.notes,
      sort_order: count ?? 0,
    })
    .select(INCOME_SOURCE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createIncomeSource: failed to create income source", error);
    return { status: "error", message: "Couldn't add that income source. Please try again." };
  }

  return { status: "success", incomeSource: mapIncomeSourceRow(data) };
}

const updateIncomeSourceSchema = z.object({
  name: z.string().trim().min(1, "Give this income a name.").max(100, "Keep it under 100 characters.").optional(),
  amountCents: amountCentsSchema.optional(),
  frequency: frequencySchema.optional(),
  isActive: z.boolean().optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type UpdateIncomeSourceInput = z.input<typeof updateIncomeSourceSchema>;

export async function updateIncomeSource(
  incomeSourceId: string,
  input: UpdateIncomeSourceInput,
): Promise<IncomeSourceMutationResult> {
  await requireUser();

  const parsed = updateIncomeSourceSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    amount_cents?: number;
    frequency?: BudgetIncomeFrequency;
    is_active?: boolean;
    notes?: string | null;
  } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.amountCents !== undefined) patch.amount_cents = parsed.data.amountCents;
  if (parsed.data.frequency !== undefined) patch.frequency = parsed.data.frequency;
  if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive;
  // `notes` transforms `undefined -> null` on the parsed output even when
  // omitted from `input` - checking presence on the raw `input` (not the
  // parsed value) is what makes "leave this alone" and "clear it"
  // distinguishable, the same fix `updateExpense` applies to its own
  // nullable fields.
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_income_sources")
    .update(patch)
    .eq("id", incomeSourceId)
    .select(INCOME_SOURCE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateIncomeSource: failed to update income source", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", incomeSource: mapIncomeSourceRow(data) };
}

export type DeleteIncomeSourceResult = { status: "success" } | { status: "error"; message: string };

export async function deleteIncomeSource(incomeSourceId: string): Promise<DeleteIncomeSourceResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_income_sources").delete().eq("id", incomeSourceId);

  if (error) {
    console.error("deleteIncomeSource: failed to delete income source", error);
    return { status: "error", message: "Couldn't remove that income source. Please try again." };
  }

  return { status: "success" };
}

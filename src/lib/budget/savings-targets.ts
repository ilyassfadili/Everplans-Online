import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { parseAmountToCents } from "@/lib/budget/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetRecurringFrequency, BudgetSavingsTarget } from "@/types/budget";

/**
 * Budget Planner savings targets - `public.budget_savings_targets`
 * (Prompt 3 Phase 4). A savings target is a *planned* recurring
 * contribution, optionally toward a goal - it never itself moves money or
 * edits `budget_goals.currentAmountCents` (that stays a direct, manual
 * number on the goal, edited from the Goals page - Prompt 3 Phase 3's own
 * "avoid forcing users to manually duplicate information" is satisfied by
 * having exactly one place that number lives, not by this table writing to
 * it). Deliberately outside `calculateBudgetSummary`'s own planned-spending
 * math too - the same "avoid double-counting" instruction: a savings
 * target names an intention, not a category deducting from available
 * income a second time.
 */

const SAVINGS_TARGET_COLUMNS = "id, plan_id, goal_id, name, planned_amount_cents, frequency, is_active, created_at, updated_at";

type SavingsTargetRow = {
  id: string;
  plan_id: string;
  goal_id: string | null;
  name: string;
  planned_amount_cents: number;
  frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapSavingsTargetRow(row: SavingsTargetRow): BudgetSavingsTarget {
  return {
    id: row.id,
    planId: row.plan_id,
    goalId: row.goal_id,
    name: row.name,
    plannedAmountCents: row.planned_amount_cents,
    // Cast, not re-validated: `budget_savings_targets_frequency_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    frequency: row.frequency as BudgetRecurringFrequency,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSavingsTargetsForPlan(planId: string): Promise<BudgetSavingsTarget[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_savings_targets")
    .select(SAVINGS_TARGET_COLUMNS)
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getSavingsTargetsForPlan: failed to load savings targets", error);
    return [];
  }

  return (data ?? []).map(mapSavingsTargetRow);
}

const amountCentsSchema = z
  .string()
  .trim()
  .transform((value) => parseAmountToCents(value))
  .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative."));

const frequencySchema = z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]);

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const createSavingsTargetSchema = z.object({
  name: z.string().trim().min(1, "Give this a name.").max(100, "Keep it under 100 characters."),
  plannedAmountCents: amountCentsSchema,
  frequency: frequencySchema.optional().default("monthly"),
  goalId: optionalIdSchema,
});

export type CreateSavingsTargetInput = z.input<typeof createSavingsTargetSchema>;

export type SavingsTargetMutationResult =
  | { status: "success"; savingsTarget: BudgetSavingsTarget }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createSavingsTarget(planId: string, input: CreateSavingsTargetInput): Promise<SavingsTargetMutationResult> {
  await requireUser();

  const parsed = createSavingsTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_savings_targets")
    .insert({
      plan_id: planId,
      name: parsed.data.name,
      planned_amount_cents: parsed.data.plannedAmountCents,
      frequency: parsed.data.frequency,
      goal_id: parsed.data.goalId,
    })
    .select(SAVINGS_TARGET_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createSavingsTarget: failed to create savings target", error);
    return { status: "error", message: "Couldn't add that savings plan. Please try again." };
  }

  return { status: "success", savingsTarget: mapSavingsTargetRow(data) };
}

const updateSavingsTargetSchema = z.object({
  name: z.string().trim().min(1, "Give this a name.").max(100, "Keep it under 100 characters.").optional(),
  plannedAmountCents: amountCentsSchema.optional(),
  frequency: frequencySchema.optional(),
  goalId: optionalIdSchema,
  isActive: z.boolean().optional(),
});

export type UpdateSavingsTargetInput = z.input<typeof updateSavingsTargetSchema>;

export async function updateSavingsTarget(
  savingsTargetId: string,
  input: UpdateSavingsTargetInput,
): Promise<SavingsTargetMutationResult> {
  await requireUser();

  const parsed = updateSavingsTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    planned_amount_cents?: number;
    frequency?: BudgetRecurringFrequency;
    goal_id?: string | null;
    is_active?: boolean;
  } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.plannedAmountCents !== undefined) patch.planned_amount_cents = parsed.data.plannedAmountCents;
  if (parsed.data.frequency !== undefined) patch.frequency = parsed.data.frequency;
  if (Object.hasOwn(input, "goalId")) patch.goal_id = parsed.data.goalId;
  if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_savings_targets")
    .update(patch)
    .eq("id", savingsTargetId)
    .select(SAVINGS_TARGET_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateSavingsTarget: failed to update savings target", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", savingsTarget: mapSavingsTargetRow(data) };
}

export type DeleteSavingsTargetResult = { status: "success" } | { status: "error"; message: string };

export async function deleteSavingsTarget(savingsTargetId: string): Promise<DeleteSavingsTargetResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_savings_targets").delete().eq("id", savingsTargetId);

  if (error) {
    console.error("deleteSavingsTarget: failed to delete savings target", error);
    return { status: "error", message: "Couldn't remove that savings plan. Please try again." };
  }

  return { status: "success" };
}

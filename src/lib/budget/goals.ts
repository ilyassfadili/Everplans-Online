import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { parseAmountToCents } from "@/lib/budget/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetGoal, BudgetGoalStatus } from "@/types/budget";

/**
 * Budget Planner financial goals - `public.budget_goals`. Foundation-level
 * CRUD only (Prompt 1 Phase 4: "do not yet build the complete
 * financial-goals system") - Prompt 3 Phase 3 builds progress tracking,
 * richer status derivation, and the full goals experience on top of this.
 */

const GOAL_COLUMNS = "id, plan_id, name, target_amount_cents, current_amount_cents, target_date, description, status, sort_order, created_at, updated_at";

type GoalRow = {
  id: string;
  plan_id: string;
  name: string;
  target_amount_cents: number;
  current_amount_cents: number;
  target_date: string | null;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapGoalRow(row: GoalRow): BudgetGoal {
  return {
    id: row.id,
    planId: row.plan_id,
    name: row.name,
    targetAmountCents: row.target_amount_cents,
    currentAmountCents: row.current_amount_cents,
    targetDate: row.target_date,
    description: row.description,
    // Cast, not re-validated: `budget_goals_status_valid` (the migration)
    // already guarantees the database can never hold anything outside this
    // union.
    status: row.status as BudgetGoalStatus,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getGoalsForPlan(planId: string): Promise<BudgetGoal[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_goals")
    .select(GOAL_COLUMNS)
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getGoalsForPlan: failed to load goals", error);
    return [];
  }

  return (data ?? []).map(mapGoalRow);
}

const amountCentsSchema = z
  .string()
  .trim()
  .transform((value) => parseAmountToCents(value))
  .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative."));

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const createGoalSchema = z.object({
  name: z.string().trim().min(1, "Give this goal a name.").max(100, "Keep it under 100 characters."),
  targetAmountCents: amountCentsSchema,
  targetDate: optionalDateSchema,
  description: z
    .string()
    .trim()
    .max(500, "Keep this under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type CreateGoalInput = z.input<typeof createGoalSchema>;

export type GoalMutationResult =
  | { status: "success"; goal: BudgetGoal }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createGoal(planId: string, input: CreateGoalInput): Promise<GoalMutationResult> {
  await requireUser();

  const parsed = createGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase.from("budget_goals").select("id", { count: "exact", head: true }).eq("plan_id", planId);

  const { data, error } = await supabase
    .from("budget_goals")
    .insert({
      plan_id: planId,
      name: parsed.data.name,
      target_amount_cents: parsed.data.targetAmountCents,
      target_date: parsed.data.targetDate,
      description: parsed.data.description,
      sort_order: count ?? 0,
    })
    .select(GOAL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createGoal: failed to create goal", error);
    return { status: "error", message: "Couldn't add that goal. Please try again." };
  }

  return { status: "success", goal: mapGoalRow(data) };
}

const updateGoalSchema = z.object({
  name: z.string().trim().min(1, "Give this goal a name.").max(100, "Keep it under 100 characters.").optional(),
  targetAmountCents: amountCentsSchema.optional(),
  currentAmountCents: amountCentsSchema.optional(),
  targetDate: optionalDateSchema,
  description: z
    .string()
    .trim()
    .max(500, "Keep this under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  status: z.enum(["not-started", "in-progress", "completed"]).optional(),
});

export type UpdateGoalInput = z.input<typeof updateGoalSchema>;

export async function updateGoal(goalId: string, input: UpdateGoalInput): Promise<GoalMutationResult> {
  await requireUser();

  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    target_amount_cents?: number;
    current_amount_cents?: number;
    target_date?: string | null;
    description?: string | null;
    status?: BudgetGoalStatus;
  } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.targetAmountCents !== undefined) patch.target_amount_cents = parsed.data.targetAmountCents;
  if (parsed.data.currentAmountCents !== undefined) patch.current_amount_cents = parsed.data.currentAmountCents;
  if (Object.hasOwn(input, "targetDate")) patch.target_date = parsed.data.targetDate;
  if (Object.hasOwn(input, "description")) patch.description = parsed.data.description;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("budget_goals").update(patch).eq("id", goalId).select(GOAL_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateGoal: failed to update goal", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", goal: mapGoalRow(data) };
}

export type DeleteGoalResult = { status: "success" } | { status: "error"; message: string };

export async function deleteGoal(goalId: string): Promise<DeleteGoalResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_goals").delete().eq("id", goalId);

  if (error) {
    console.error("deleteGoal: failed to delete goal", error);
    return { status: "error", message: "Couldn't remove that goal. Please try again." };
  }

  return { status: "success" };
}

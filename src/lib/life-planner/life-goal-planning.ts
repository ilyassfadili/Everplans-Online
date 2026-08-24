import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LIFE_GOAL_MILESTONE_STATUSES,
  type LifeGoalActionStep,
  type LifeGoalMilestone,
  type LifeGoalMilestoneStatus,
} from "@/types/life-planner";

import { getLifeGoalById, updateLifeGoal } from "./life-goals";

/**
 * Goal Planning - `public.life_goal_milestones` and
 * `public.life_goal_action_steps`
 * (`supabase/migrations/20260914000000_life_planner_goal_planning.sql`),
 * both children of `public.life_goals`. Same shape as `@/lib/life-planner/life-goals`:
 * every exported function calls `requireUser()` itself, and RLS (a direct
 * `owner_id = auth.uid()` policy on both tables) independently enforces
 * "only this user's own rows." RLS alone doesn't catch a caller-supplied
 * `goal_id`/`milestone_id` pointing at *someone else's* goal/milestone
 * though (RLS only checks the row being written, never the row a foreign
 * key references) - see `getLifeGoalById`/`verifyMilestoneOwnership`'s own
 * comments for the extra checks this file layers on top for exactly that.
 *
 * `server-only`: reads/writes both tables through the server Supabase
 * client. Never safe to import from a Client Component.
 */

/**
 * Verifies `milestoneId` belongs to both the current user and `goalId`
 * before letting an action step reference it - `life_goal_action_steps`'
 * own insert/update policies only check the *action step's* `owner_id`, not
 * that a caller-supplied `milestone_id` actually belongs to that same owner
 * (or even to the same goal), so an unverified id would let a signed-in
 * user attach their own action step to any milestone id they can guess -
 * including another user's. Same reasoning `createMilestone`/
 * `createActionStep`'s own `getLifeGoalById(goalId)` check documents for
 * `goalId` just below.
 */
async function verifyMilestoneOwnership(milestoneId: string, goalId: string, ownerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("life_goal_milestones")
    .select("id")
    .eq("id", milestoneId)
    .eq("goal_id", goalId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("verifyMilestoneOwnership: failed to check milestone", error);
    return false;
  }

  return data !== null;
}

const MILESTONE_COLUMNS = "id, owner_id, goal_id, title, status, target_date, position, created_at, updated_at";
const ACTION_STEP_COLUMNS = "id, owner_id, goal_id, milestone_id, title, is_completed, position, created_at, updated_at";

type LifeGoalMilestoneRow = {
  id: string;
  owner_id: string;
  goal_id: string;
  title: string;
  status: string;
  target_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

type LifeGoalActionStepRow = {
  id: string;
  owner_id: string;
  goal_id: string;
  milestone_id: string | null;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

function mapLifeGoalMilestoneRow(row: LifeGoalMilestoneRow): LifeGoalMilestone {
  return {
    id: row.id,
    ownerId: row.owner_id,
    goalId: row.goal_id,
    title: row.title,
    // Cast, not re-validated: every row this DAL ever writes goes through
    // `milestoneStatusSchema` first, and the table's own `check` constraint
    // backs that up at the database layer - the same convention
    // `mapLifeGoalRow` applies to its own `status`/`priority`.
    status: row.status as LifeGoalMilestoneStatus,
    targetDate: row.target_date,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLifeGoalActionStepRow(row: LifeGoalActionStepRow): LifeGoalActionStep {
  return {
    id: row.id,
    ownerId: row.owner_id,
    goalId: row.goal_id,
    milestoneId: row.milestone_id,
    title: row.title,
    isCompleted: row.is_completed,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction `DatePicker`'s own `toIsoDate` uses). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** `days` days from today, as `YYYY-MM-DD` - the upper bound of the dashboard's "upcoming" window. */
function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

/** Every Milestone under `goalId`, in `position` order - the goal detail page's own "Milestones" section. */
export async function getMilestonesForGoal(goalId: string): Promise<LifeGoalMilestone[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_goal_milestones")
    .select(MILESTONE_COLUMNS)
    .eq("owner_id", user.id)
    .eq("goal_id", goalId)
    .order("position", { ascending: true });

  if (error) {
    console.error("getMilestonesForGoal: failed to load milestones", error);
    return [];
  }

  return (data ?? []).map(mapLifeGoalMilestoneRow);
}

const milestoneStatusSchema = z.enum(LIFE_GOAL_MILESTONE_STATUSES);

const milestoneTargetDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Give this milestone a title.").max(120, "Keep it under 120 characters."),
  targetDate: milestoneTargetDateSchema,
  status: milestoneStatusSchema.optional().default("not_started"),
});

export type CreateMilestoneInput = z.input<typeof createMilestoneSchema>;

export type LifeGoalMilestoneMutationResult =
  | { status: "success"; milestone: LifeGoalMilestone }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Appends a new Milestone to the end of `goalId`'s own list - the "Add milestone" inline form's action. Recomputes `goalId`'s progress afterward, since a fresh milestone can change a milestone-derived progress percentage. */
export async function createMilestone(goalId: string, input: CreateMilestoneInput): Promise<LifeGoalMilestoneMutationResult> {
  const user = await requireUser();

  const parsed = createMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  // Unlike `updateMilestone`/`deleteMilestone` (which only ever touch a row
  // whose own `owner_id` RLS already scopes to the caller), this is an
  // *insert* against a caller-supplied `goalId` - `life_goal_milestones`'
  // own insert policy only checks the new row's `owner_id`, not that
  // `goal_id` actually belongs to that same owner, so an unverified
  // `goalId` would let a signed-in user attach a milestone to any goal id
  // they can guess. `getLifeGoalById` is itself owner-scoped, so a `null`
  // here means "not mine" (or doesn't exist) either way.
  const goal = await getLifeGoalById(goalId);
  if (!goal) {
    return { status: "error", message: "That goal no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("life_goal_milestones")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("goal_id", goalId);

  const { data, error } = await supabase
    .from("life_goal_milestones")
    .insert({
      owner_id: user.id,
      goal_id: goalId,
      title: parsed.data.title,
      status: parsed.data.status,
      target_date: parsed.data.targetDate,
      position: count ?? 0,
    })
    .select(MILESTONE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createMilestone: failed to create milestone", error);
    return { status: "error", message: "Couldn't add that milestone. Please try again." };
  }

  await recomputeGoalProgress(goalId);

  return { status: "success", milestone: mapLifeGoalMilestoneRow(data) };
}

const updateMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Give this milestone a title.").max(120, "Keep it under 120 characters.").optional(),
  targetDate: milestoneTargetDateSchema,
  status: milestoneStatusSchema.optional(),
});

export type UpdateMilestoneInput = z.input<typeof updateMilestoneSchema>;

/** Edits a Milestone in place - a partial patch, the same "check presence on the raw input, not the parsed output" shape `updateLifeGoal` uses. Covers the status-cycle control and the target-date field alike; recomputes `goalId`'s progress afterward, since a status change can move a milestone in or out of "completed". */
export async function updateMilestone(id: string, input: UpdateMilestoneInput): Promise<LifeGoalMilestoneMutationResult> {
  const user = await requireUser();

  const parsed = updateMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { title?: string; status?: LifeGoalMilestoneStatus; target_date?: string | null } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (Object.hasOwn(input, "targetDate")) patch.target_date = parsed.data.targetDate;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_goal_milestones")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(MILESTONE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateMilestone: failed to update milestone", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  await recomputeGoalProgress(data.goal_id);

  return { status: "success", milestone: mapLifeGoalMilestoneRow(data) };
}

export type LifeGoalPlanningDeleteResult = { status: "success" } | { status: "error"; message: string };

/** Deletes a Milestone outright - its own action steps aren't deleted with it (`milestone_id` FK is `on delete set null`), they just fall back to "unassigned". Recomputes `goalId`'s progress afterward. */
export async function deleteMilestone(id: string): Promise<LifeGoalPlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_goal_milestones").delete().eq("id", id).eq("owner_id", user.id).select("goal_id").maybeSingle();

  if (error) {
    console.error("deleteMilestone: failed to delete milestone", error);
    return { status: "error", message: "Couldn't remove that milestone. Please try again." };
  }

  if (data?.goal_id) {
    await recomputeGoalProgress(data.goal_id);
  }

  return { status: "success" };
}

/** Swaps one Milestone's `position` with its neighbor within the same goal - the same "load the full ordered list, find the neighbor, swap" shape `moveLifeArea` (`@/lib/life-planner/life-areas`) uses, scoped to `goal_id` instead of being one flat list. `direction: "up"` moves toward the start of the list. */
export async function reorderMilestone(id: string, direction: "up" | "down"): Promise<LifeGoalPlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("life_goal_milestones")
    .select("id, goal_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (targetError || !target) {
    console.error("reorderMilestone: failed to load milestone", targetError);
    return { status: "error", message: "That milestone no longer exists." };
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("life_goal_milestones")
    .select("id, position")
    .eq("owner_id", user.id)
    .eq("goal_id", target.goal_id)
    .order("position", { ascending: true });

  if (siblingsError || !siblings) {
    console.error("reorderMilestone: failed to load milestones", siblingsError);
    return { status: "error", message: "Couldn't reorder that milestone. Please try again." };
  }

  const currentIndex = siblings.findIndex((row) => row.id === id);
  const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const neighbor = siblings[neighborIndex];

  if (currentIndex === -1 || !neighbor) {
    // Already at the edge of the list (or gone) - not an error, just nothing to do.
    return { status: "success" };
  }

  const current = siblings[currentIndex]!;

  const [firstUpdate, secondUpdate] = await Promise.all([
    supabase.from("life_goal_milestones").update({ position: neighbor.position }).eq("id", current.id).eq("owner_id", user.id),
    supabase.from("life_goal_milestones").update({ position: current.position }).eq("id", neighbor.id).eq("owner_id", user.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    console.error("reorderMilestone: failed to swap position", firstUpdate.error ?? secondUpdate.error);
    return { status: "error", message: "Couldn't reorder that milestone. Please try again." };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// Action steps
// ---------------------------------------------------------------------------

/** Every Action Step under `goalId`, in `position` order - the goal detail page's own "Action steps" section groups this flat list by `milestoneId` itself (including `null` as "Unassigned") rather than this function returning a pre-grouped shape, so the same list also works for a plain "how many total steps" count. */
export async function getActionStepsForGoal(goalId: string): Promise<LifeGoalActionStep[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_goal_action_steps")
    .select(ACTION_STEP_COLUMNS)
    .eq("owner_id", user.id)
    .eq("goal_id", goalId)
    .order("position", { ascending: true });

  if (error) {
    console.error("getActionStepsForGoal: failed to load action steps", error);
    return [];
  }

  return (data ?? []).map(mapLifeGoalActionStepRow);
}

// A Milestone select renders its "no milestone" choice as an empty string
// (Radix `Select.Item` can't take a genuinely empty `value`), so this
// normalizes both "field omitted" and the empty-string sentinel to `null`
// before the real `uuid()` check runs - the same shape `life-goals.ts`'s own
// `lifeAreaIdSchema` uses for the analogous "no area" case.
const milestoneIdSchema = z
  .union([z.string().trim().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

const createActionStepSchema = z.object({
  title: z.string().trim().min(1, "Give this step a title.").max(160, "Keep it under 160 characters."),
  milestoneId: milestoneIdSchema,
});

export type CreateActionStepInput = z.input<typeof createActionStepSchema>;

export type LifeGoalActionStepMutationResult =
  | { status: "success"; actionStep: LifeGoalActionStep }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Appends a new Action Step to the end of its own group - "the end of `goalId`'s unassigned steps" when `milestoneId` is omitted, "the end of that milestone's own steps" otherwise. Recomputes `goalId`'s progress afterward, since action steps are the primary progress signal once any exist. */
export async function createActionStep(goalId: string, input: CreateActionStepInput): Promise<LifeGoalActionStepMutationResult> {
  const user = await requireUser();

  const parsed = createActionStepSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  // Same "verify the caller-supplied `goalId` is actually theirs before
  // inserting against it" guard `createMilestone` uses just above - see
  // that function's own comment for why `life_goal_action_steps`' insert
  // policy alone can't catch this.
  const goal = await getLifeGoalById(goalId);
  if (!goal) {
    return { status: "error", message: "That goal no longer exists." };
  }

  if (parsed.data.milestoneId && !(await verifyMilestoneOwnership(parsed.data.milestoneId, goalId, user.id))) {
    return { status: "error", message: "That milestone no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const countQuery = supabase.from("life_goal_action_steps").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("goal_id", goalId);
  const { count } = parsed.data.milestoneId ? await countQuery.eq("milestone_id", parsed.data.milestoneId) : await countQuery.is("milestone_id", null);

  const { data, error } = await supabase
    .from("life_goal_action_steps")
    .insert({
      owner_id: user.id,
      goal_id: goalId,
      milestone_id: parsed.data.milestoneId,
      title: parsed.data.title,
      position: count ?? 0,
    })
    .select(ACTION_STEP_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createActionStep: failed to create action step", error);
    return { status: "error", message: "Couldn't add that step. Please try again." };
  }

  await recomputeGoalProgress(goalId);

  return { status: "success", actionStep: mapLifeGoalActionStepRow(data) };
}

const updateActionStepSchema = z.object({
  title: z.string().trim().min(1, "Give this step a title.").max(160, "Keep it under 160 characters.").optional(),
  milestoneId: milestoneIdSchema,
});

export type UpdateActionStepInput = z.input<typeof updateActionStepSchema>;

/** Edits an Action Step's title and/or milestone assignment in place - a partial patch, same "check presence on the raw input" shape as `updateMilestone`. Doesn't touch `isCompleted` - that's `toggleActionStepCompletion`'s own job. */
export async function updateActionStep(id: string, input: UpdateActionStepInput): Promise<LifeGoalActionStepMutationResult> {
  const user = await requireUser();

  const parsed = updateActionStepSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  if (Object.hasOwn(input, "milestoneId") && parsed.data.milestoneId) {
    // The action step's own `goal_id` is what a re-assigned `milestoneId`
    // must belong to - loaded owner-scoped first so `verifyMilestoneOwnership`
    // has a real (and not caller-supplied) `goalId` to check against.
    const { data: existing, error: existingError } = await supabase
      .from("life_goal_action_steps")
      .select("goal_id")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existingError || !existing) {
      console.error("updateActionStep: failed to load action step", existingError);
      return { status: "error", message: "That step no longer exists." };
    }

    if (!(await verifyMilestoneOwnership(parsed.data.milestoneId, existing.goal_id, user.id))) {
      return { status: "error", message: "That milestone no longer exists." };
    }
  }

  const patch: { title?: string; milestone_id?: string | null } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (Object.hasOwn(input, "milestoneId")) patch.milestone_id = parsed.data.milestoneId;

  const { data, error } = await supabase
    .from("life_goal_action_steps")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(ACTION_STEP_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateActionStep: failed to update action step", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  await recomputeGoalProgress(data.goal_id);

  return { status: "success", actionStep: mapLifeGoalActionStepRow(data) };
}

/** Flips one Action Step's `isCompleted` - the checkbox's own action. Recomputes `goalId`'s progress afterward; this is the single most common trigger for that recompute. */
export async function toggleActionStepCompletion(id: string): Promise<LifeGoalActionStepMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: current, error: currentError } = await supabase
    .from("life_goal_action_steps")
    .select("id, is_completed, goal_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (currentError || !current) {
    console.error("toggleActionStepCompletion: failed to load action step", currentError);
    return { status: "error", message: "Couldn't update that step. Please try again." };
  }

  const { data, error } = await supabase
    .from("life_goal_action_steps")
    .update({ is_completed: !current.is_completed })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(ACTION_STEP_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("toggleActionStepCompletion: failed to update action step", error);
    return { status: "error", message: "Couldn't update that step. Please try again." };
  }

  await recomputeGoalProgress(current.goal_id);

  return { status: "success", actionStep: mapLifeGoalActionStepRow(data) };
}

/** Deletes an Action Step outright. Recomputes `goalId`'s progress afterward. */
export async function deleteActionStep(id: string): Promise<LifeGoalPlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_goal_action_steps").delete().eq("id", id).eq("owner_id", user.id).select("goal_id").maybeSingle();

  if (error) {
    console.error("deleteActionStep: failed to delete action step", error);
    return { status: "error", message: "Couldn't remove that step. Please try again." };
  }

  if (data?.goal_id) {
    await recomputeGoalProgress(data.goal_id);
  }

  return { status: "success" };
}

/** Swaps one Action Step's `position` with its neighbor - scoped to steps sharing both the same `goal_id` AND the same `milestone_id` (including the "unassigned" `null` group), so reordering only ever moves a step within the same on-screen group it's already displayed in. Same "load the group, find the neighbor, swap" shape `reorderMilestone` uses one level up. */
export async function reorderActionStep(id: string, direction: "up" | "down"): Promise<LifeGoalPlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("life_goal_action_steps")
    .select("id, goal_id, milestone_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (targetError || !target) {
    console.error("reorderActionStep: failed to load action step", targetError);
    return { status: "error", message: "That step no longer exists." };
  }

  const siblingsQuery = supabase.from("life_goal_action_steps").select("id, position").eq("owner_id", user.id).eq("goal_id", target.goal_id);
  const { data: siblings, error: siblingsError } = await (target.milestone_id
    ? siblingsQuery.eq("milestone_id", target.milestone_id)
    : siblingsQuery.is("milestone_id", null)
  ).order("position", { ascending: true });

  if (siblingsError || !siblings) {
    console.error("reorderActionStep: failed to load action steps", siblingsError);
    return { status: "error", message: "Couldn't reorder that step. Please try again." };
  }

  const currentIndex = siblings.findIndex((row) => row.id === id);
  const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const neighbor = siblings[neighborIndex];

  if (currentIndex === -1 || !neighbor) {
    return { status: "success" };
  }

  const current = siblings[currentIndex]!;

  const [firstUpdate, secondUpdate] = await Promise.all([
    supabase.from("life_goal_action_steps").update({ position: neighbor.position }).eq("id", current.id).eq("owner_id", user.id),
    supabase.from("life_goal_action_steps").update({ position: current.position }).eq("id", neighbor.id).eq("owner_id", user.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    console.error("reorderActionStep: failed to swap position", firstUpdate.error ?? secondUpdate.error);
    return { status: "error", message: "Couldn't reorder that step. Please try again." };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// Derived progress
// ---------------------------------------------------------------------------

/**
 * Recomputes and persists `life_goals.progress` for `goalId` from its
 * action steps (preferred) or milestones (fallback) - Prompt 2 Phase 3's own
 * derived-progress rule (see the master build spec's `life_goals.progress`
 * note). Called after every milestone/action-step create, update, delete,
 * and completion toggle that could change a completion count; never after a
 * reorder, since swapping `position` values can't change what's complete.
 *
 * - `goalId` has >=1 action step: progress = `round(100 * completed / total)`
 *   across all of that goal's action steps - milestones are ignored entirely
 *   once any action step exists (even an incomplete one), since action
 *   steps are the more granular signal.
 * - `goalId` has 0 action steps but >=1 milestone: progress =
 *   `round(100 * completedMilestones / totalMilestones)`.
 * - `goalId` has neither: does nothing - leaves `life_goals.progress`
 *   exactly as the user last set it by hand via the goal edit form, rather
 *   than zeroing out a manually-entered value the moment this function runs.
 */
export async function recomputeGoalProgress(goalId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [totalStepsResult, completedStepsResult] = await Promise.all([
    supabase.from("life_goal_action_steps").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("goal_id", goalId),
    supabase
      .from("life_goal_action_steps")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("goal_id", goalId)
      .eq("is_completed", true),
  ]);

  if (totalStepsResult.error || completedStepsResult.error) {
    console.error("recomputeGoalProgress: failed to count action steps", totalStepsResult.error ?? completedStepsResult.error);
    return;
  }

  let progress: number | null = null;
  const totalSteps = totalStepsResult.count ?? 0;

  if (totalSteps > 0) {
    progress = Math.round((100 * (completedStepsResult.count ?? 0)) / totalSteps);
  } else {
    const [totalMilestonesResult, completedMilestonesResult] = await Promise.all([
      supabase.from("life_goal_milestones").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("goal_id", goalId),
      supabase
        .from("life_goal_milestones")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("goal_id", goalId)
        .eq("status", "completed"),
    ]);

    if (totalMilestonesResult.error || completedMilestonesResult.error) {
      console.error("recomputeGoalProgress: failed to count milestones", totalMilestonesResult.error ?? completedMilestonesResult.error);
      return;
    }

    const totalMilestones = totalMilestonesResult.count ?? 0;
    if (totalMilestones > 0) {
      progress = Math.round((100 * (completedMilestonesResult.count ?? 0)) / totalMilestones);
    }
  }

  // Neither action steps nor milestones exist for this goal - leave the
  // user's manually-set progress untouched rather than overwriting it with 0.
  if (progress === null) {
    return;
  }

  const result = await updateLifeGoal(goalId, { progress });
  if (result.status !== "success") {
    console.error("recomputeGoalProgress: failed to persist computed progress", result);
  }
}

// ---------------------------------------------------------------------------
// Dashboard: upcoming target dates
// ---------------------------------------------------------------------------

export interface UpcomingLifePlanningDate {
  id: string;
  kind: "goal" | "milestone";
  /** The goal's own title (`kind: "goal"`) or the milestone's own title (`kind: "milestone"`). */
  label: string;
  goalId: string;
  /** The owning goal's title - always present, even for `kind: "goal"` (where it duplicates `label`), so the UI can render one consistent "label · goalTitle" shape without a branch. */
  goalTitle: string;
  /** ISO `YYYY-MM-DD`. */
  targetDate: string;
  href: string;
}

const UPCOMING_WINDOW_DAYS = 30;
const UPCOMING_LIMIT = 5;

type UpcomingGoalRow = { id: string; title: string; target_date: string | null };
type UpcomingMilestoneRow = { id: string; title: string; target_date: string | null; goal_id: string; life_goals: { title: string } | null };

/**
 * Every goal target date AND milestone target date, across all of the
 * current user's goals, that falls within the next `UPCOMING_WINDOW_DAYS`
 * days (today inclusive) - the dashboard's own small "Upcoming target
 * dates" list. Soonest-first, capped at `UPCOMING_LIMIT`. Returns `[]`
 * (never an error state) when nothing is upcoming, so the dashboard can
 * simply omit the whole section - this list is secondary, not something
 * worth a dedicated empty state.
 */
export async function getUpcomingTargetDatesForCurrentUser(): Promise<UpcomingLifePlanningDate[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const from = todayIso();
  const to = addDaysIso(UPCOMING_WINDOW_DAYS);

  const [goalsResult, milestonesResult] = await Promise.all([
    supabase.from("life_goals").select("id, title, target_date").eq("owner_id", user.id).gte("target_date", from).lte("target_date", to),
    supabase
      .from("life_goal_milestones")
      .select("id, title, target_date, goal_id, life_goals(title)")
      .eq("owner_id", user.id)
      .gte("target_date", from)
      .lte("target_date", to),
  ]);

  if (goalsResult.error || milestonesResult.error) {
    console.error("getUpcomingTargetDatesForCurrentUser: failed to load upcoming dates", goalsResult.error ?? milestonesResult.error);
    return [];
  }

  const items: UpcomingLifePlanningDate[] = [];

  for (const goal of (goalsResult.data ?? []) as UpcomingGoalRow[]) {
    if (!goal.target_date) continue;
    items.push({ id: `goal-${goal.id}`, kind: "goal", label: goal.title, goalId: goal.id, goalTitle: goal.title, targetDate: goal.target_date, href: `/app/life-planner/goals/${goal.id}` });
  }

  for (const milestone of (milestonesResult.data ?? []) as unknown as UpcomingMilestoneRow[]) {
    if (!milestone.target_date) continue;
    items.push({
      id: `milestone-${milestone.id}`,
      kind: "milestone",
      label: milestone.title,
      goalId: milestone.goal_id,
      goalTitle: milestone.life_goals?.title ?? "",
      targetDate: milestone.target_date,
      href: `/app/life-planner/goals/${milestone.goal_id}`,
    });
  }

  items.sort((a, b) => (a.targetDate < b.targetDate ? -1 : a.targetDate > b.targetDate ? 1 : 0));

  return items.slice(0, UPCOMING_LIMIT);
}

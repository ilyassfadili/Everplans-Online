import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LIFE_TASK_PRIORITIES, LIFE_TASK_STATUSES, type LifeTask, type LifeTaskPriority, type LifeTaskStatus } from "@/types/life-planner";

import { getLifeGoalById } from "./life-goals";

/**
 * Life Tasks - `public.life_tasks`
 * (`supabase/migrations/20260915000000_life_planner_tasks.sql`), a third
 * top-level table alongside `@/lib/life-planner/life-goals` and
 * `@/lib/life-planner/life-areas` rather than a child of either. Same shape
 * as both: every exported function calls `requireUser()` itself, and RLS (a
 * direct `owner_id = auth.uid()` policy) independently enforces "only this
 * user's own tasks."
 *
 * `server-only`: reads/writes `public.life_tasks` through the server
 * Supabase client. Never safe to import from a Client Component.
 */

const TASK_COLUMNS =
  "id, owner_id, life_area_id, goal_id, title, description, due_date, priority, status, completed_at, is_archived, created_at, updated_at";

type LifeTaskRow = {
  id: string;
  owner_id: string;
  life_area_id: string | null;
  goal_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  completed_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

function mapLifeTaskRow(row: LifeTaskRow): LifeTask {
  return {
    id: row.id,
    ownerId: row.owner_id,
    lifeAreaId: row.life_area_id,
    goalId: row.goal_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    // Cast, not re-validated: every row this DAL ever writes goes through
    // `prioritySchema`/`statusSchema` first, and the table's own `check`
    // constraints back that up at the database layer - the same convention
    // `mapLifeGoalRow` applies to its own `status`/`priority`.
    priority: row.priority as LifeTaskPriority,
    status: row.status as LifeTaskStatus,
    completedAt: row.completed_at,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction `DatePicker`'s own `toIsoDate` and `life-goal-planning.ts`'s own `todayIso` use). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const PRIORITY_RANK: Record<LifeTaskPriority, number> = { high: 0, medium: 1, low: 2 };

// Where a task sits in "how urgent is this right now" order - the tasks
// list, the dashboard's "Today's priorities" preview, and a goal's own
// compact task list all want the same sensible default: not-yet-completed
// tasks with a due date first (earliest/most overdue due date first, so an
// overdue task naturally floats above one due next week), then
// not-yet-completed tasks with no due date at all (sorted by priority -
// `high` first - since there's no date to sort by), and `completed` tasks
// trailing behind both groups. Supabase/PostgREST can't express "order by
// whether a date column is null, then by the date, then by an arbitrary
// priority ranking" in a single `.order()` call without a database view or
// RPC this phase doesn't need yet, so it's a small in-memory sort instead -
// the same "cheap for the one-user scale this table will ever see" reasoning
// `compareLifeGoals` (`@/lib/life-planner/life-goals`) already applies.
function compareLifeTasks(a: LifeTask, b: LifeTask): number {
  const completedRankA = a.status === "completed" ? 1 : 0;
  const completedRankB = b.status === "completed" ? 1 : 0;
  if (completedRankA !== completedRankB) return completedRankA - completedRankB;

  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }

  const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  // Final tiebreaker: most recently created first, so a brand-new task
  // with no due date doesn't get buried at the bottom of its group.
  return b.createdAt.localeCompare(a.createdAt);
}

export interface GetTasksOptions {
  /** Include archived tasks - `false` (the default) is every real view of this list; only a future "archive" screen would ever pass `true`. */
  includeArchived?: boolean;
}

/**
 * Every Life Task the current user has, ordered "most urgent first" - see
 * `compareLifeTasks`. Excludes archived tasks by default (`archiveTask` is
 * this table's "delete" affordance - an archived task shouldn't keep
 * cluttering every list it was ever in).
 */
export async function getTasksForCurrentUser(opts: GetTasksOptions = {}): Promise<LifeTask[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("life_tasks").select(TASK_COLUMNS).eq("owner_id", user.id);
  if (!opts.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getTasksForCurrentUser: failed to load life tasks", error);
    return [];
  }

  return (data ?? []).map(mapLifeTaskRow).sort(compareLifeTasks);
}

/**
 * One Life Task by id, owner-scoped - `null` both when no row with that id
 * exists at all and when it belongs to someone else (RLS already prevents
 * the latter from ever returning data, and the explicit `owner_id` filter
 * here is the same belt-and-suspenders confirmation `getLifeGoalById`
 * already applies one product over).
 */
export async function getTaskById(id: string): Promise<LifeTask | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_tasks").select(TASK_COLUMNS).eq("id", id).eq("owner_id", user.id).maybeSingle();

  if (error) {
    console.error("getTaskById: failed to load life task", error);
    return null;
  }

  return data ? mapLifeTaskRow(data) : null;
}

/**
 * Every non-archived Life Task linked to `goalId`, "most urgent first" (see
 * `compareLifeTasks`) - the goal detail page's own compact "Tasks for this
 * goal" section. A dedicated query rather than filtering
 * `getTasksForCurrentUser()`'s full result client-side, the same "narrower,
 * purpose-built query beats reusing the general one" shape
 * `getMilestonesForGoal`/`getActionStepsForGoal`
 * (`@/lib/life-planner/life-goal-planning`) already establish.
 */
export async function getTasksForGoal(goalId: string): Promise<LifeTask[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_tasks")
    .select(TASK_COLUMNS)
    .eq("owner_id", user.id)
    .eq("goal_id", goalId)
    .eq("is_archived", false);

  if (error) {
    console.error("getTasksForGoal: failed to load tasks for goal", error);
    return [];
  }

  return (data ?? []).map(mapLifeTaskRow).sort(compareLifeTasks);
}

const TODAYS_PRIORITIES_LIMIT = 5;

/**
 * Up to `TODAYS_PRIORITIES_LIMIT` non-archived, not-yet-completed tasks due
 * today or earlier (overdue), soonest-due first - the dashboard's own
 * "Today's priorities" section (Phase 1 §6). A dedicated, narrowly-filtered
 * query rather than slicing `getTasksForCurrentUser()`'s full result, the
 * same "purpose-built query for a dashboard preview" shape
 * `getUpcomingTargetDatesForCurrentUser` (`@/lib/life-planner/life-goal-planning`)
 * already establishes.
 */
export async function getTodaysPrioritiesForCurrentUser(): Promise<LifeTask[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_tasks")
    .select(TASK_COLUMNS)
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .neq("status", "completed")
    .lte("due_date", todayIso())
    .order("due_date", { ascending: true })
    .limit(TODAYS_PRIORITIES_LIMIT);

  if (error) {
    console.error("getTodaysPrioritiesForCurrentUser: failed to load today's priorities", error);
    return [];
  }

  return (data ?? []).map(mapLifeTaskRow);
}

const prioritySchema = z.enum(LIFE_TASK_PRIORITIES);
const statusSchema = z.enum(LIFE_TASK_STATUSES);

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, "Keep it under 1000 characters.")
  .optional()
  .transform((value) => (value ? value : null));

const dueDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

// A Life Area/Goal select renders its "none" choice as an empty string
// (Radix `Select.Item` can't take a genuinely empty `value`), so this
// normalizes both "field omitted" and the empty-string sentinel to `null`
// before the real `uuid()` check runs - the same "" -> null normalization
// `life-goals.ts`'s own `lifeAreaIdSchema` uses.
const optionalUuidSchema = z
  .union([z.string().trim().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give this task a title.").max(140, "Keep it under 140 characters."),
  description: descriptionSchema,
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
  dueDate: dueDateSchema,
  priority: prioritySchema.optional().default("medium"),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;

export type LifeTaskMutationResult =
  | { status: "success"; task: LifeTask }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Verifies `lifeAreaId` belongs to the current user before letting a task
 * reference it - `life_areas`' own insert/update policies only check the
 * *task's* `owner_id`, not that a caller-supplied `life_area_id` actually
 * belongs to that same owner, so an unverified id would let a signed-in
 * user file a task under any area id they can guess. Same reasoning
 * `createMilestone` (`@/lib/life-planner/life-goal-planning`) documents for
 * its own caller-supplied `goalId` - see that function's own comment.
 */
async function verifyLifeAreaOwnership(lifeAreaId: string, ownerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("life_areas").select("id").eq("id", lifeAreaId).eq("owner_id", ownerId).maybeSingle();

  if (error) {
    console.error("verifyLifeAreaOwnership: failed to check life area", error);
    return false;
  }

  return data !== null;
}

/**
 * Verifies `goalId` belongs to the current user before letting a task
 * reference it - reuses `getLifeGoalById`, which is already owner-scoped
 * (a `null` result covers both "doesn't exist" and "belongs to someone
 * else"), the exact same guard `createMilestone`/`createActionStep`
 * (`@/lib/life-planner/life-goal-planning`) already apply for the same
 * reason.
 */
async function verifyGoalOwnership(goalId: string): Promise<boolean> {
  const goal = await getLifeGoalById(goalId);
  return goal !== null;
}

/**
 * Creates a new Life Task for the current user - both the tasks list's
 * quick-add form and its full "New task" form share this one action.
 * Cross-user isolation for `lifeAreaId`/`goalId`: both are verified against
 * the current user before the insert proceeds, since neither
 * `life_tasks`' own insert policy nor either referenced table's policy
 * catches "does this id actually belong to me" on its own - see
 * `verifyLifeAreaOwnership`/`verifyGoalOwnership`'s own comments.
 */
export async function createTask(input: CreateTaskInput): Promise<LifeTaskMutationResult> {
  const user = await requireUser();

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (parsed.data.lifeAreaId && !(await verifyLifeAreaOwnership(parsed.data.lifeAreaId, user.id))) {
    return { status: "error", message: "That Life Area no longer exists." };
  }

  if (parsed.data.goalId && !(await verifyGoalOwnership(parsed.data.goalId))) {
    return { status: "error", message: "That goal no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_tasks")
    .insert({
      owner_id: user.id,
      life_area_id: parsed.data.lifeAreaId,
      goal_id: parsed.data.goalId,
      title: parsed.data.title,
      description: parsed.data.description,
      due_date: parsed.data.dueDate,
      priority: parsed.data.priority,
    })
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createTask: failed to create life task", error);
    return { status: "error", message: "Couldn't add that task. Please try again." };
  }

  return { status: "success", task: mapLifeTaskRow(data) };
}

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Give this task a title.").max(140, "Keep it under 140 characters.").optional(),
  description: descriptionSchema,
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
  dueDate: dueDateSchema,
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
});

export type UpdateTaskInput = z.input<typeof updateTaskSchema>;

/**
 * Edits a Life Task in place - a partial patch (only the fields actually
 * present in `input` are written), the same "check presence on the raw
 * input, not the parsed output" shape `updateLifeGoal` uses. Covers
 * everything a task can change, including `status` - the detail page's full
 * edit form (whose status select can pick any of the three states directly,
 * unlike the completion checkbox elsewhere, which only ever toggles between
 * "done" and "not done") goes through this one function. A `status` change
 * here keeps `completedAt` consistent the same way `completeTask`/
 * `reopenTask` do: picking `"completed"` stamps it, picking anything else
 * clears it - so a task can never end up `completed` with a stale/missing
 * timestamp, or non-`completed` with a timestamp left over from before.
 */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<LifeTaskMutationResult> {
  const user = await requireUser();

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (Object.hasOwn(input, "lifeAreaId") && parsed.data.lifeAreaId && !(await verifyLifeAreaOwnership(parsed.data.lifeAreaId, user.id))) {
    return { status: "error", message: "That Life Area no longer exists." };
  }

  if (Object.hasOwn(input, "goalId") && parsed.data.goalId && !(await verifyGoalOwnership(parsed.data.goalId))) {
    return { status: "error", message: "That goal no longer exists." };
  }

  const patch: {
    title?: string;
    description?: string | null;
    life_area_id?: string | null;
    goal_id?: string | null;
    due_date?: string | null;
    priority?: LifeTaskPriority;
    status?: LifeTaskStatus;
    completed_at?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (Object.hasOwn(input, "description")) patch.description = parsed.data.description;
  if (Object.hasOwn(input, "lifeAreaId")) patch.life_area_id = parsed.data.lifeAreaId;
  if (Object.hasOwn(input, "goalId")) patch.goal_id = parsed.data.goalId;
  if (Object.hasOwn(input, "dueDate")) patch.due_date = parsed.data.dueDate;
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;
  if (parsed.data.status !== undefined) {
    patch.status = parsed.data.status;
    patch.completed_at = parsed.data.status === "completed" ? new Date().toISOString() : null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_tasks").update(patch).eq("id", taskId).eq("owner_id", user.id).select(TASK_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateTask: failed to update life task", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", task: mapLifeTaskRow(data) };
}

/**
 * Marks a Life Task done - sets `status: "completed"` and stamps
 * `completedAt` with the current time. The completion checkbox/toggle's own
 * action, everywhere one appears (the tasks list, the dashboard's "Today's
 * priorities," a goal's own compact task list).
 */
export async function completeTask(taskId: string): Promise<LifeTaskMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("owner_id", user.id)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("completeTask: failed to complete life task", error);
    return { status: "error", message: "Couldn't complete that task. Please try again." };
  }

  return { status: "success", task: mapLifeTaskRow(data) };
}

/**
 * Un-marks a completed Life Task - sets `status: "todo"` (not
 * `"in_progress"`; reopening starts a task back at the beginning of its own
 * cycle rather than guessing it should resume mid-flight) and clears
 * `completedAt`. The inverse of `completeTask`, offered wherever a
 * completed task's checkbox/toggle appears.
 */
export async function reopenTask(taskId: string): Promise<LifeTaskMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_tasks")
    .update({ status: "todo", completed_at: null })
    .eq("id", taskId)
    .eq("owner_id", user.id)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("reopenTask: failed to reopen life task", error);
    return { status: "error", message: "Couldn't reopen that task. Please try again." };
  }

  return { status: "success", task: mapLifeTaskRow(data) };
}

/**
 * Archives a Life Task - sets `isArchived: true`, leaving the row (and its
 * history) in place. This is `life_tasks`' own "delete" affordance from the
 * UI (Phase 1 §3's "delete/archive where appropriate" wording) - see
 * `deleteTask` below for the plain hard delete this deliberately isn't.
 */
export async function archiveTask(taskId: string): Promise<LifeTaskMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_tasks")
    .update({ is_archived: true })
    .eq("id", taskId)
    .eq("owner_id", user.id)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("archiveTask: failed to archive life task", error);
    return { status: "error", message: "Couldn't archive that task. Please try again." };
  }

  return { status: "success", task: mapLifeTaskRow(data) };
}

export type DeleteTaskResult = { status: "success" } | { status: "error"; message: string };

/**
 * Deletes a Life Task outright - kept for parity with every other Life
 * Planner DAL (`deleteLifeGoal`, `deleteLifeArea`, `deleteMilestone`), but
 * the tasks UI never surfaces this as its primary "remove" action -
 * `archiveTask` is. No "keep at least one" floor, the same "a user is free
 * to end up with zero" reasoning `deleteLifeGoal` already applies.
 */
export async function deleteTask(taskId: string): Promise<DeleteTaskResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_tasks").delete().eq("id", taskId).eq("owner_id", user.id);

  if (error) {
    console.error("deleteTask: failed to delete life task", error);
    return { status: "error", message: "Couldn't remove that task. Please try again." };
  }

  return { status: "success" };
}

import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LIFE_GOAL_PRIORITIES, LIFE_GOAL_STATUSES, type LifeGoal, type LifeGoalPriority, type LifeGoalStatus } from "@/types/life-planner";

/**
 * Life Goals - `public.life_goals`
 * (`supabase/migrations/20260913000000_life_planner_goals.sql`), the second
 * child table of `public.life_plans` and a sibling (not a child) of
 * `public.life_areas`. Same shape as `@/lib/life-planner/life-areas`: every
 * exported function calls `requireUser()` itself, and RLS (a direct
 * `owner_id = auth.uid()` policy) independently enforces "only this user's
 * own goals."
 *
 * `server-only`: reads/writes `public.life_goals` through the server
 * Supabase client. Never safe to import from a Client Component.
 */

const GOAL_COLUMNS = "id, owner_id, life_area_id, title, description, target_date, priority, status, progress, notes, created_at, updated_at";

type LifeGoalRow = {
  id: string;
  owner_id: string;
  life_area_id: string | null;
  title: string;
  description: string | null;
  target_date: string | null;
  priority: string;
  status: string;
  progress: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapLifeGoalRow(row: LifeGoalRow): LifeGoal {
  return {
    id: row.id,
    ownerId: row.owner_id,
    lifeAreaId: row.life_area_id,
    title: row.title,
    description: row.description,
    targetDate: row.target_date,
    // Cast, not re-validated: every row this DAL ever writes goes through
    // `prioritySchema`/`z.enum(LIFE_GOAL_STATUSES)` first, and the table's
    // own `check` constraints back that up at the database layer - the same
    // "database can never hold anything outside this union in practice"
    // convention `mapLifeAreaRow` applies to its own `icon_key`/`color_key`.
    priority: row.priority as LifeGoalPriority,
    status: row.status as LifeGoalStatus,
    progress: row.progress,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Where a goal sits in "how live is this right now" order - the dashboard's
// compact preview and the full list both want an actively-worked-on goal
// (`in_progress`/`not_started`) surfaced ahead of one that's `paused`, and
// `completed` goals trailing behind both, rather than a plain
// creation-order or alphabetical list. Supabase/PostgREST can't express
// "order by this arbitrary status ranking" in a single `.order()` call
// without a database view or RPC this phase doesn't need yet, so it's a
// small in-memory sort instead - cheap for the "a few dozen goals, one
// user" scale this table will ever see.
const STATUS_RANK: Record<LifeGoalStatus, number> = {
  in_progress: 0,
  not_started: 0,
  paused: 1,
  completed: 2,
};

function compareLifeGoals(a: LifeGoal, b: LifeGoal): number {
  const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (rankDiff !== 0) return rankDiff;

  // Within the same rank, an earlier target date is more urgent - goals
  // with no target date at all sort after every dated goal in that group,
  // not first (a date-less goal isn't "due immediately").
  if (a.targetDate !== b.targetDate) {
    if (a.targetDate === null) return 1;
    if (b.targetDate === null) return -1;
    return a.targetDate < b.targetDate ? -1 : 1;
  }

  // Final tiebreaker: most recently created first, so a brand-new goal
  // with no target date doesn't get buried at the bottom of its group.
  return b.createdAt.localeCompare(a.createdAt);
}

/**
 * Every Life Goal the current user has, ordered "most relevant first" -
 * active goals (`not_started`/`in_progress`) ahead of `paused`, `completed`
 * trailing behind both, and within each of those groups the soonest target
 * date first (date-less goals last within their group). See `compareLifeGoals`.
 */
export async function getLifeGoalsForCurrentUser(): Promise<LifeGoal[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_goals").select(GOAL_COLUMNS).eq("owner_id", user.id);

  if (error) {
    console.error("getLifeGoalsForCurrentUser: failed to load life goals", error);
    return [];
  }

  return (data ?? []).map(mapLifeGoalRow).sort(compareLifeGoals);
}

/**
 * One Life Goal by id, owner-scoped - `null` both when no row with that id
 * exists at all and when it belongs to someone else (RLS already prevents
 * the latter from ever returning data, and the explicit `owner_id` filter
 * here is the same belt-and-suspenders confirmation
 * `VendorDetailPage`'s own `vendor.weddingId !== wedding.id` check applies
 * one product over).
 */
export async function getLifeGoalById(id: string): Promise<LifeGoal | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_goals").select(GOAL_COLUMNS).eq("id", id).eq("owner_id", user.id).maybeSingle();

  if (error) {
    console.error("getLifeGoalById: failed to load life goal", error);
    return null;
  }

  return data ? mapLifeGoalRow(data) : null;
}

/**
 * How many of the current user's goals are filed under each Life Area -
 * one small query (just the `life_area_id` column, no full rows) reduced to
 * a `Map` in memory, rather than a `count(*) group by` RPC this codebase
 * has no existing pattern for. Goals with no area (`life_area_id: null`)
 * are simply absent from the returned map - callers should treat a missing
 * key the same as a zero count.
 */
export async function getLifeGoalCountsByArea(): Promise<Map<string, number>> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_goals").select("life_area_id").eq("owner_id", user.id);

  if (error) {
    console.error("getLifeGoalCountsByArea: failed to load life goal counts", error);
    return new Map();
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.life_area_id) continue;
    counts.set(row.life_area_id, (counts.get(row.life_area_id) ?? 0) + 1);
  }

  return counts;
}

const prioritySchema = z.enum(LIFE_GOAL_PRIORITIES);
const statusSchema = z.enum(LIFE_GOAL_STATUSES);

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, "Keep it under 1000 characters.")
  .optional()
  .transform((value) => (value ? value : null));

const notesSchema = z
  .string()
  .trim()
  .max(1000, "Keep it under 1000 characters.")
  .optional()
  .transform((value) => (value ? value : null));

const targetDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

// A Life Area select renders its "no area" choice as an empty string (Radix
// `Select.Item` can't take a genuinely empty `value`), so this normalizes
// both "field omitted" and "the empty-string sentinel" to `null` before the
// real `uuid()` check runs - the same "" -> null normalization
// `descriptionSchema` applies to free text, just with a stricter target
// shape once it isn't empty.
const lifeAreaIdSchema = z
  .union([z.string().trim().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

/**
 * Verifies `lifeAreaId` belongs to the current user before letting a goal
 * reference it - `life_areas`' own insert/update policies only check the
 * *goal's* `owner_id`, not that a caller-supplied `life_area_id` actually
 * belongs to that same owner, so an unverified id would let a signed-in
 * user file a goal under any area id they can guess. Same reasoning
 * `verifyLifeAreaOwnership` (`@/lib/life-planner/life-tasks`) documents for
 * its own caller-supplied id.
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

const createLifeGoalSchema = z.object({
  title: z.string().trim().min(1, "Give this goal a title.").max(120, "Keep it under 120 characters."),
  description: descriptionSchema,
  lifeAreaId: lifeAreaIdSchema,
  targetDate: targetDateSchema,
  priority: prioritySchema.optional().default("medium"),
  notes: notesSchema,
});

export type CreateLifeGoalInput = z.input<typeof createLifeGoalSchema>;

export type LifeGoalMutationResult =
  | { status: "success"; goal: LifeGoal }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates a new Life Goal for the current user - the "New goal" form's
 * action. Unlike `createLifeArea`, this takes no caller-supplied `planId`:
 * a goal carries only its own `owner_id`, not a `plan_id`, the same
 * "user-owned, not plan-owned" shape `budget_goals` already uses.
 */
export async function createLifeGoal(input: CreateLifeGoalInput): Promise<LifeGoalMutationResult> {
  const user = await requireUser();

  const parsed = createLifeGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (parsed.data.lifeAreaId && !(await verifyLifeAreaOwnership(parsed.data.lifeAreaId, user.id))) {
    return { status: "error", message: "That Life Area no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_goals")
    .insert({
      owner_id: user.id,
      life_area_id: parsed.data.lifeAreaId,
      title: parsed.data.title,
      description: parsed.data.description,
      target_date: parsed.data.targetDate,
      priority: parsed.data.priority,
      notes: parsed.data.notes,
    })
    .select(GOAL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createLifeGoal: failed to create life goal", error);
    return { status: "error", message: "Couldn't add that goal. Please try again." };
  }

  return { status: "success", goal: mapLifeGoalRow(data) };
}

const updateLifeGoalSchema = z.object({
  title: z.string().trim().min(1, "Give this goal a title.").max(120, "Keep it under 120 characters.").optional(),
  description: descriptionSchema,
  lifeAreaId: lifeAreaIdSchema,
  targetDate: targetDateSchema,
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
  progress: z.coerce.number("Enter a whole number.").int("Enter a whole number.").min(0, "Can't go below 0.").max(100, "Can't go above 100.").optional(),
  notes: notesSchema,
});

export type UpdateLifeGoalInput = z.input<typeof updateLifeGoalSchema>;

/**
 * Edits a Life Goal in place - a partial patch (only the fields actually
 * present in `input` are written), the same "check presence on the raw
 * input, not the parsed output" shape `updateLifeArea` uses so an edit that
 * only touches `status` can't accidentally null out an existing
 * `description`. Covers everything a goal can change, including
 * `status`/`progress` - the detail page's status-and-progress control and
 * its full edit form both go through this one function.
 */
export async function updateLifeGoal(goalId: string, input: UpdateLifeGoalInput): Promise<LifeGoalMutationResult> {
  const user = await requireUser();

  const parsed = updateLifeGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (Object.hasOwn(input, "lifeAreaId") && parsed.data.lifeAreaId && !(await verifyLifeAreaOwnership(parsed.data.lifeAreaId, user.id))) {
    return { status: "error", message: "That Life Area no longer exists." };
  }

  const patch: {
    title?: string;
    description?: string | null;
    life_area_id?: string | null;
    target_date?: string | null;
    priority?: LifeGoalPriority;
    status?: LifeGoalStatus;
    progress?: number;
    notes?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (Object.hasOwn(input, "description")) patch.description = parsed.data.description;
  if (Object.hasOwn(input, "lifeAreaId")) patch.life_area_id = parsed.data.lifeAreaId;
  if (Object.hasOwn(input, "targetDate")) patch.target_date = parsed.data.targetDate;
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.progress !== undefined) patch.progress = parsed.data.progress;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_goals").update(patch).eq("id", goalId).eq("owner_id", user.id).select(GOAL_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateLifeGoal: failed to update life goal", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", goal: mapLifeGoalRow(data) };
}

export type DeleteLifeGoalResult = { status: "success" } | { status: "error"; message: string };

/**
 * Deletes a Life Goal outright - no soft-delete/restore concept, the same
 * "delete means delete" shape `deleteLifeArea` uses. Unlike `deleteLifeArea`,
 * there's no "keep at least one" floor: a user is free to end up with zero
 * goals, since nothing downstream assumes goals always exist the way every
 * future area-scoped feature assumes at least one area does.
 */
export async function deleteLifeGoal(goalId: string): Promise<DeleteLifeGoalResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_goals").delete().eq("id", goalId).eq("owner_id", user.id);

  if (error) {
    console.error("deleteLifeGoal: failed to delete life goal", error);
    return { status: "error", message: "Couldn't remove that goal. Please try again." };
  }

  return { status: "success" };
}

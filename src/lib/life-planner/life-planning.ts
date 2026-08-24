import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LIFE_PLAN_PRIORITY_SOURCE_TYPES,
  type LifeGoal,
  type LifeMonthlyPlan,
  type LifeMonthlyPriority,
  type LifePlanPrioritySourceType,
  type LifeTask,
  type LifeWeeklyPlan,
  type LifeWeeklyPriority,
} from "@/types/life-planner";

import { getLifeGoalById, getLifeGoalsForCurrentUser } from "./life-goals";
import { getHabitsProgressForCurrentUser, type HabitWithProgress } from "./life-habits";
import { getTodaysRoutineItemsForCurrentUser, type TodaysRoutineGroup } from "./life-routines";
import { getTaskById, getTasksForCurrentUser } from "./life-tasks";

/**
 * Weekly & Monthly Planning - `public.life_weekly_plans`/
 * `public.life_weekly_priorities`/`public.life_monthly_plans`/
 * `public.life_monthly_priorities`
 * (`supabase/migrations/20260918000000_life_planner_planning.sql`), Life
 * Planner Prompt 4 Phase 1. Deliberately a thin curation/aggregation layer,
 * not a new source of truth: `getWeekSummary`/`getMonthSummary` below pull
 * from `@/lib/life-planner/life-goals`, `life-tasks`, `life-habits`, and
 * `life-routines`'s own already-exported functions rather than requerying
 * `life_goals`/`life_tasks`/etc. tables directly, and priorities only ever
 * *reference* a goal/task via `sourceId` (never copy its fields) when a
 * user chooses to promote one into a week's/month's priority list.
 *
 * Same shape as every other Life Planner DAL: every exported function calls
 * `requireUser()` itself, and RLS (a direct `owner_id = auth.uid()` policy
 * on all four tables) independently enforces "only this user's own rows."
 *
 * Weekly and monthly plans/priorities get their own full set of mirrored
 * functions rather than one generic implementation parameterized by table
 * name - the same "each table gets its own written-out functions, even
 * when nearly identical to a sibling" convention `life-routines.ts`'s
 * routine-vs-item mutations and `life-goal-planning.ts`'s milestone-vs-
 * action-step mutations already follow, and the only shape that keeps
 * Supabase's generated `Database` types checking each `.from(...)` call
 * against its own real table rather than a loosely-typed dynamic key.
 *
 * `server-only`: reads/writes all four tables through the server Supabase
 * client. Never safe to import from a Client Component.
 */

// ---------------------------------------------------------------------------
// Date helpers - pure, no database call, so they're equally usable from a
// Server Component reading a `?week=`/`?month=` search param and from this
// file's own mutations.
// ---------------------------------------------------------------------------

/** A `Date` as local-calendar `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Today's local calendar date as `YYYY-MM-DD`. */
function todayIso(): string {
  return toIso(new Date());
}

/** Parses an ISO `YYYY-MM-DD` string into a local-time `Date` at midnight - never `new Date(isoString)` directly, which parses a bare date as UTC midnight and can shift a day backward once converted back to local time. */
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** The Monday that starts `date`'s own calendar week (Monday-Sunday), as ISO `YYYY-MM-DD` - the same Monday-start convention `startOfWeek` (`@/lib/life-planner/life-habits`) already uses for habit streak math. `getDay()` returns 0=Sunday..6=Saturday, so Sunday is the one day that steps back 6 rather than `day - 1`. */
export function getWeekStartForDate(date: Date): string {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(monday.getDate() + offset);
  return toIso(monday);
}

/** The 1st of `date`'s own calendar month, as ISO `YYYY-MM-DD`. */
export function getMonthStartForDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/** `weekStartIso` shifted by `n` weeks (negative to go backward), as ISO `YYYY-MM-DD` - the Weekly Planning page's own prev/next navigation. */
export function addWeeks(weekStartIso: string, n: number): string {
  const date = parseIsoDate(weekStartIso);
  date.setDate(date.getDate() + n * 7);
  return toIso(date);
}

/** `monthStartIso` shifted by `n` calendar months (negative to go backward), as ISO `YYYY-MM-DD` - the Monthly Planning page's own prev/next navigation. Always lands on the 1st, regardless of what day of the month `monthStartIso` itself was (it always is one, by construction, but this doesn't assume that). */
export function addMonths(monthStartIso: string, n: number): string {
  const date = parseIsoDate(monthStartIso);
  const shifted = new Date(date.getFullYear(), date.getMonth() + n, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-01`;
}

/** The last day of `weekStartIso`'s own week (the following Sunday), as ISO `YYYY-MM-DD` - `getWeekSummary`'s own inclusive range end. Not part of the phase brief's own four named helpers, but needed to actually call `getWeekSummary`/`getMonthSummary` below, which take both a start and an end. */
export function getWeekEnd(weekStartIso: string): string {
  const date = parseIsoDate(weekStartIso);
  date.setDate(date.getDate() + 6);
  return toIso(date);
}

/** The last day of `monthStartIso`'s own month, as ISO `YYYY-MM-DD` - `getMonthSummary`'s own inclusive range end, see `getWeekEnd`'s own comment. */
export function getMonthEnd(monthStartIso: string): string {
  const date = parseIsoDate(monthStartIso);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return toIso(lastDay);
}

// ---------------------------------------------------------------------------
// Weekly Plans
// ---------------------------------------------------------------------------

const WEEKLY_PLAN_COLUMNS = "id, owner_id, week_start, notes, created_at, updated_at";

type LifeWeeklyPlanRow = {
  id: string;
  owner_id: string;
  week_start: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapWeeklyPlanRow(row: LifeWeeklyPlanRow): LifeWeeklyPlan {
  return {
    id: row.id,
    ownerId: row.owner_id,
    weekStart: row.week_start,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetches the current user's Weekly Plan for `weekStart` (ISO `YYYY-MM-DD`,
 * expected to already be a Monday - see `getWeekStartForDate`), creating a
 * bare row (`notes: null`) if this is the first visit to that week - no
 * separate onboarding step. Duplicate-safe under a genuine race (two tabs
 * hitting the same week at once) the same way `createLifePlan`
 * (`@/lib/life-planner/life-plans`) is: `life_weekly_plans`' own
 * `unique (owner_id, week_start)` constraint makes the losing insert fail
 * with `23505`, treated as "already exists" rather than a real error.
 *
 * Throws (rather than returning a result type) on genuine failure - every
 * Life Planner route this backs already sits under `error.tsx`, the same
 * "let the nearest error boundary handle it" shape this function's own
 * `Promise<LifeWeeklyPlan>` return type (never `null`, never a `status`
 * union) commits to.
 */
export async function getOrCreateWeeklyPlan(weekStart: string): Promise<LifeWeeklyPlan> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("life_weekly_plans")
    .select(WEEKLY_PLAN_COLUMNS)
    .eq("owner_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (fetchError) {
    console.error("getOrCreateWeeklyPlan: failed to load weekly plan", fetchError);
    throw new Error("Couldn't load this week's plan. Please try again.");
  }
  if (existing) {
    return mapWeeklyPlanRow(existing);
  }

  const { data: created, error: insertError } = await supabase
    .from("life_weekly_plans")
    .insert({ owner_id: user.id, week_start: weekStart })
    .select(WEEKLY_PLAN_COLUMNS)
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced } = await supabase
        .from("life_weekly_plans")
        .select(WEEKLY_PLAN_COLUMNS)
        .eq("owner_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      if (raced) return mapWeeklyPlanRow(raced);
    }
    console.error("getOrCreateWeeklyPlan: failed to create weekly plan", insertError);
    throw new Error("Couldn't set up this week's plan. Please try again.");
  }
  if (!created) {
    throw new Error("Couldn't set up this week's plan. Please try again.");
  }

  return mapWeeklyPlanRow(created);
}

export type LifeWeeklyPlanMutationResult =
  | { status: "success"; plan: LifeWeeklyPlan }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

const planNotesSchema = z
  .string()
  .trim()
  .max(2000, "Keep it under 2000 characters.")
  .optional()
  .transform((value) => (value ? value : null));

/** Saves a Weekly Plan's free-text notes - the Weekly Planning page's own "Save notes" form action. `input` is `unknown` since the Server Action calling this reads raw `FormData`. */
export async function updateWeeklyPlanNotes(id: string, input: unknown): Promise<LifeWeeklyPlanMutationResult> {
  const user = await requireUser();

  const parsed = planNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("life_weekly_plans")
    .update({ notes: parsed.data })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(WEEKLY_PLAN_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateWeeklyPlanNotes: failed to update weekly plan", error);
    return { status: "error", message: "Couldn't save your notes. Please try again." };
  }

  return { status: "success", plan: mapWeeklyPlanRow(data) };
}

// ---------------------------------------------------------------------------
// Weekly Priorities
// ---------------------------------------------------------------------------

const WEEKLY_PRIORITY_COLUMNS = "id, owner_id, weekly_plan_id, title, source_type, source_id, is_done, position, created_at, updated_at";

type LifeWeeklyPriorityRow = {
  id: string;
  owner_id: string;
  weekly_plan_id: string;
  title: string;
  source_type: string;
  source_id: string | null;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

function mapWeeklyPriorityRow(row: LifeWeeklyPriorityRow): LifeWeeklyPriority {
  return {
    id: row.id,
    ownerId: row.owner_id,
    weeklyPlanId: row.weekly_plan_id,
    title: row.title,
    // Cast, not re-validated: every row this DAL ever writes goes through
    // `prioritySourceTypeSchema` first, and the table's own `check`
    // constraint backs that up at the database layer - the same convention
    // `mapLifeHabitRow` applies to its own `frequency`.
    sourceType: row.source_type as LifePlanPrioritySourceType,
    sourceId: row.source_id,
    isDone: row.is_done,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every priority on a Weekly Plan, in `position` order - the Weekly Planning page's own "This week's priorities" list. */
export async function getWeeklyPrioritiesForPlan(weeklyPlanId: string): Promise<LifeWeeklyPriority[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_weekly_priorities")
    .select(WEEKLY_PRIORITY_COLUMNS)
    .eq("owner_id", user.id)
    .eq("weekly_plan_id", weeklyPlanId)
    .order("position", { ascending: true });

  if (error) {
    console.error("getWeeklyPrioritiesForPlan: failed to load weekly priorities", error);
    return [];
  }

  return (data ?? []).map(mapWeeklyPriorityRow);
}

/**
 * Up to `limit` not-done priorities from the current user's *current* week
 * (`getWeekStartForDate(new Date())`), soonest-added first - the
 * dashboard's own compact "This week's priorities" preview
 * (`WeeklyPlanningSection`), which needs a plan's priorities without the
 * page itself first calling `getOrCreateWeeklyPlan` (the dashboard is a
 * read-only preview - it shouldn't provision a week's plan just by being
 * viewed). Returns `[]`, not an error, when the current week has no plan
 * row yet at all - an honest "nothing to preview," the same as any other
 * not-yet-provisioned Life Planner list.
 */
export async function getCurrentWeekPrioritiesForCurrentUser(limit = 4): Promise<LifeWeeklyPriority[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const weekStart = getWeekStartForDate(new Date());

  const { data: plan, error: planError } = await supabase
    .from("life_weekly_plans")
    .select("id")
    .eq("owner_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (planError) {
    console.error("getCurrentWeekPrioritiesForCurrentUser: failed to load weekly plan", planError);
    return [];
  }
  if (!plan) {
    return [];
  }

  const { data, error } = await supabase
    .from("life_weekly_priorities")
    .select(WEEKLY_PRIORITY_COLUMNS)
    .eq("owner_id", user.id)
    .eq("weekly_plan_id", plan.id)
    .eq("is_done", false)
    .order("position", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("getCurrentWeekPrioritiesForCurrentUser: failed to load weekly priorities", error);
    return [];
  }

  return (data ?? []).map(mapWeeklyPriorityRow);
}

const prioritySourceTypeSchema = z.enum(LIFE_PLAN_PRIORITY_SOURCE_TYPES);

const optionalUuidSchema = z
  .union([z.string().trim().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

const addPlanPrioritySchema = z.object({
  title: z.string().trim().min(1, "Give this priority a title.").max(140, "Keep it under 140 characters."),
  sourceType: prioritySourceTypeSchema.optional().default("custom"),
  sourceId: optionalUuidSchema,
});

export type AddPlanPriorityInput = z.input<typeof addPlanPrioritySchema>;

export type LifeWeeklyPriorityMutationResult =
  | { status: "success"; priority: LifeWeeklyPriority }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export type LifePlanningDeleteResult = { status: "success" } | { status: "error"; message: string };

async function verifyWeeklyPlanOwnership(weeklyPlanId: string, ownerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("life_weekly_plans").select("id").eq("id", weeklyPlanId).eq("owner_id", ownerId).maybeSingle();

  if (error) {
    console.error("verifyWeeklyPlanOwnership: failed to check weekly plan", error);
    return false;
  }

  return data !== null;
}

/**
 * Adds a priority to a Weekly Plan - either typed from scratch
 * (`sourceType: "custom"`, the default) or promoted from an existing goal/
 * task (`sourceType: "goal"`/`"task"` plus that row's own id as
 * `sourceId`). Cross-user isolation for both `weeklyPlanId` and `sourceId`:
 * a caller-supplied `weeklyPlanId` is verified against the current user
 * before the insert proceeds (`verifyWeeklyPlanOwnership`), and when
 * `sourceType` is `"goal"`/`"task"`, `sourceId` is verified the same way
 * via `getLifeGoalById`/`getTaskById` (both already owner-scoped) - the
 * same "caller-supplied id, unverified by the table's own insert policy"
 * guard `verifyLifeAreaOwnership`/`verifyGoalOwnership`
 * (`@/lib/life-planner/life-tasks`) already apply for their own
 * caller-supplied filing references.
 */
export async function addWeeklyPriority(weeklyPlanId: string, input: AddPlanPriorityInput): Promise<LifeWeeklyPriorityMutationResult> {
  const user = await requireUser();

  const parsed = addPlanPrioritySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (!(await verifyWeeklyPlanOwnership(weeklyPlanId, user.id))) {
    return { status: "error", message: "That weekly plan no longer exists." };
  }

  if (parsed.data.sourceType === "goal" && parsed.data.sourceId && !(await getLifeGoalById(parsed.data.sourceId))) {
    return { status: "error", message: "That goal no longer exists." };
  }
  if (parsed.data.sourceType === "task" && parsed.data.sourceId && !(await getTaskById(parsed.data.sourceId))) {
    return { status: "error", message: "That task no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("life_weekly_priorities")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("weekly_plan_id", weeklyPlanId);

  const { data, error } = await supabase
    .from("life_weekly_priorities")
    .insert({
      owner_id: user.id,
      weekly_plan_id: weeklyPlanId,
      title: parsed.data.title,
      source_type: parsed.data.sourceType,
      source_id: parsed.data.sourceType === "custom" ? null : parsed.data.sourceId,
      position: count ?? 0,
    })
    .select(WEEKLY_PRIORITY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("addWeeklyPriority: failed to create weekly priority", error);
    return { status: "error", message: "Couldn't add that priority. Please try again." };
  }

  return { status: "success", priority: mapWeeklyPriorityRow(data) };
}

/** Flips a Weekly Priority's `isDone` - the priority list's own completion toggle. Reads the current value first (rather than a database-side `not is_done`) since Supabase's query builder has no "toggle this boolean column" primitive short of raw SQL. */
export async function toggleWeeklyPriorityDone(id: string): Promise<LifeWeeklyPriorityMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase.from("life_weekly_priorities").select("is_done").eq("id", id).eq("owner_id", user.id).maybeSingle();

  if (fetchError || !existing) {
    console.error("toggleWeeklyPriorityDone: failed to load weekly priority", fetchError);
    return { status: "error", message: "That priority no longer exists." };
  }

  const { data, error } = await supabase
    .from("life_weekly_priorities")
    .update({ is_done: !existing.is_done })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(WEEKLY_PRIORITY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("toggleWeeklyPriorityDone: failed to update weekly priority", error);
    return { status: "error", message: "Couldn't update that priority. Please try again." };
  }

  return { status: "success", priority: mapWeeklyPriorityRow(data) };
}

/** Deletes a Weekly Priority outright - no soft-delete concept, this table has no archive flag. */
export async function deleteWeeklyPriority(id: string): Promise<LifePlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_weekly_priorities").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    console.error("deleteWeeklyPriority: failed to delete weekly priority", error);
    return { status: "error", message: "Couldn't remove that priority. Please try again." };
  }

  return { status: "success" };
}

/** Swaps one Weekly Priority's `position` with its neighbor within the same plan - the same "load the group, find the neighbor, swap" shape `reorderRoutineItem` (`@/lib/life-planner/life-routines`) uses, scoped to `weekly_plan_id` instead of `routine_id`. `direction: "up"` moves toward the top of the list. */
export async function reorderWeeklyPriority(id: string, direction: "up" | "down"): Promise<LifePlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("life_weekly_priorities")
    .select("id, weekly_plan_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (targetError || !target) {
    console.error("reorderWeeklyPriority: failed to load weekly priority", targetError);
    return { status: "error", message: "That priority no longer exists." };
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("life_weekly_priorities")
    .select("id, position")
    .eq("owner_id", user.id)
    .eq("weekly_plan_id", target.weekly_plan_id)
    .order("position", { ascending: true });

  if (siblingsError || !siblings) {
    console.error("reorderWeeklyPriority: failed to load weekly priorities", siblingsError);
    return { status: "error", message: "Couldn't reorder that priority. Please try again." };
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
    supabase.from("life_weekly_priorities").update({ position: neighbor.position }).eq("id", current.id).eq("owner_id", user.id),
    supabase.from("life_weekly_priorities").update({ position: current.position }).eq("id", neighbor.id).eq("owner_id", user.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    console.error("reorderWeeklyPriority: failed to swap position", firstUpdate.error ?? secondUpdate.error);
    return { status: "error", message: "Couldn't reorder that priority. Please try again." };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// Monthly Plans
// ---------------------------------------------------------------------------

const MONTHLY_PLAN_COLUMNS = "id, owner_id, month_start, notes, created_at, updated_at";

type LifeMonthlyPlanRow = {
  id: string;
  owner_id: string;
  month_start: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapMonthlyPlanRow(row: LifeMonthlyPlanRow): LifeMonthlyPlan {
  return {
    id: row.id,
    ownerId: row.owner_id,
    monthStart: row.month_start,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetches the current user's Monthly Plan for `monthStart` (ISO `YYYY-MM-DD`, expected to already be the 1st - see `getMonthStartForDate`), creating a bare row if this is the first visit to that month - the exact same on-demand, race-safe shape `getOrCreateWeeklyPlan` uses one level up. */
export async function getOrCreateMonthlyPlan(monthStart: string): Promise<LifeMonthlyPlan> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("life_monthly_plans")
    .select(MONTHLY_PLAN_COLUMNS)
    .eq("owner_id", user.id)
    .eq("month_start", monthStart)
    .maybeSingle();

  if (fetchError) {
    console.error("getOrCreateMonthlyPlan: failed to load monthly plan", fetchError);
    throw new Error("Couldn't load this month's plan. Please try again.");
  }
  if (existing) {
    return mapMonthlyPlanRow(existing);
  }

  const { data: created, error: insertError } = await supabase
    .from("life_monthly_plans")
    .insert({ owner_id: user.id, month_start: monthStart })
    .select(MONTHLY_PLAN_COLUMNS)
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced } = await supabase
        .from("life_monthly_plans")
        .select(MONTHLY_PLAN_COLUMNS)
        .eq("owner_id", user.id)
        .eq("month_start", monthStart)
        .maybeSingle();
      if (raced) return mapMonthlyPlanRow(raced);
    }
    console.error("getOrCreateMonthlyPlan: failed to create monthly plan", insertError);
    throw new Error("Couldn't set up this month's plan. Please try again.");
  }
  if (!created) {
    throw new Error("Couldn't set up this month's plan. Please try again.");
  }

  return mapMonthlyPlanRow(created);
}

export type LifeMonthlyPlanMutationResult =
  | { status: "success"; plan: LifeMonthlyPlan }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Saves a Monthly Plan's free-text notes - the Monthly Planning page's own "Save notes" form action, mirroring `updateWeeklyPlanNotes`. */
export async function updateMonthlyPlanNotes(id: string, input: unknown): Promise<LifeMonthlyPlanMutationResult> {
  const user = await requireUser();

  const parsed = planNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("life_monthly_plans")
    .update({ notes: parsed.data })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(MONTHLY_PLAN_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateMonthlyPlanNotes: failed to update monthly plan", error);
    return { status: "error", message: "Couldn't save your notes. Please try again." };
  }

  return { status: "success", plan: mapMonthlyPlanRow(data) };
}

// ---------------------------------------------------------------------------
// Monthly Priorities
// ---------------------------------------------------------------------------

const MONTHLY_PRIORITY_COLUMNS = "id, owner_id, monthly_plan_id, title, source_type, source_id, is_done, position, created_at, updated_at";

type LifeMonthlyPriorityRow = {
  id: string;
  owner_id: string;
  monthly_plan_id: string;
  title: string;
  source_type: string;
  source_id: string | null;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

function mapMonthlyPriorityRow(row: LifeMonthlyPriorityRow): LifeMonthlyPriority {
  return {
    id: row.id,
    ownerId: row.owner_id,
    monthlyPlanId: row.monthly_plan_id,
    title: row.title,
    sourceType: row.source_type as LifePlanPrioritySourceType,
    sourceId: row.source_id,
    isDone: row.is_done,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every priority on a Monthly Plan, in `position` order - the Monthly Planning page's own "This month's priorities" list. */
export async function getMonthlyPrioritiesForPlan(monthlyPlanId: string): Promise<LifeMonthlyPriority[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_monthly_priorities")
    .select(MONTHLY_PRIORITY_COLUMNS)
    .eq("owner_id", user.id)
    .eq("monthly_plan_id", monthlyPlanId)
    .order("position", { ascending: true });

  if (error) {
    console.error("getMonthlyPrioritiesForPlan: failed to load monthly priorities", error);
    return [];
  }

  return (data ?? []).map(mapMonthlyPriorityRow);
}

export type LifeMonthlyPriorityMutationResult =
  | { status: "success"; priority: LifeMonthlyPriority }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

async function verifyMonthlyPlanOwnership(monthlyPlanId: string, ownerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("life_monthly_plans").select("id").eq("id", monthlyPlanId).eq("owner_id", ownerId).maybeSingle();

  if (error) {
    console.error("verifyMonthlyPlanOwnership: failed to check monthly plan", error);
    return false;
  }

  return data !== null;
}

/** Adds a priority to a Monthly Plan - mirrors `addWeeklyPriority` one level up, including the same `weeklyPlanId`/`sourceId` ownership verification (`verifyMonthlyPlanOwnership`, `getLifeGoalById`/`getTaskById`). */
export async function addMonthlyPriority(monthlyPlanId: string, input: AddPlanPriorityInput): Promise<LifeMonthlyPriorityMutationResult> {
  const user = await requireUser();

  const parsed = addPlanPrioritySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (!(await verifyMonthlyPlanOwnership(monthlyPlanId, user.id))) {
    return { status: "error", message: "That monthly plan no longer exists." };
  }

  if (parsed.data.sourceType === "goal" && parsed.data.sourceId && !(await getLifeGoalById(parsed.data.sourceId))) {
    return { status: "error", message: "That goal no longer exists." };
  }
  if (parsed.data.sourceType === "task" && parsed.data.sourceId && !(await getTaskById(parsed.data.sourceId))) {
    return { status: "error", message: "That task no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("life_monthly_priorities")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("monthly_plan_id", monthlyPlanId);

  const { data, error } = await supabase
    .from("life_monthly_priorities")
    .insert({
      owner_id: user.id,
      monthly_plan_id: monthlyPlanId,
      title: parsed.data.title,
      source_type: parsed.data.sourceType,
      source_id: parsed.data.sourceType === "custom" ? null : parsed.data.sourceId,
      position: count ?? 0,
    })
    .select(MONTHLY_PRIORITY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("addMonthlyPriority: failed to create monthly priority", error);
    return { status: "error", message: "Couldn't add that priority. Please try again." };
  }

  return { status: "success", priority: mapMonthlyPriorityRow(data) };
}

/** Flips a Monthly Priority's `isDone` - mirrors `toggleWeeklyPriorityDone`. */
export async function toggleMonthlyPriorityDone(id: string): Promise<LifeMonthlyPriorityMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase.from("life_monthly_priorities").select("is_done").eq("id", id).eq("owner_id", user.id).maybeSingle();

  if (fetchError || !existing) {
    console.error("toggleMonthlyPriorityDone: failed to load monthly priority", fetchError);
    return { status: "error", message: "That priority no longer exists." };
  }

  const { data, error } = await supabase
    .from("life_monthly_priorities")
    .update({ is_done: !existing.is_done })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(MONTHLY_PRIORITY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("toggleMonthlyPriorityDone: failed to update monthly priority", error);
    return { status: "error", message: "Couldn't update that priority. Please try again." };
  }

  return { status: "success", priority: mapMonthlyPriorityRow(data) };
}

/** Deletes a Monthly Priority outright - mirrors `deleteWeeklyPriority`. */
export async function deleteMonthlyPriority(id: string): Promise<LifePlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_monthly_priorities").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    console.error("deleteMonthlyPriority: failed to delete monthly priority", error);
    return { status: "error", message: "Couldn't remove that priority. Please try again." };
  }

  return { status: "success" };
}

/** Swaps one Monthly Priority's `position` with its neighbor within the same plan - mirrors `reorderWeeklyPriority`, scoped to `monthly_plan_id`. */
export async function reorderMonthlyPriority(id: string, direction: "up" | "down"): Promise<LifePlanningDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("life_monthly_priorities")
    .select("id, monthly_plan_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (targetError || !target) {
    console.error("reorderMonthlyPriority: failed to load monthly priority", targetError);
    return { status: "error", message: "That priority no longer exists." };
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("life_monthly_priorities")
    .select("id, position")
    .eq("owner_id", user.id)
    .eq("monthly_plan_id", target.monthly_plan_id)
    .order("position", { ascending: true });

  if (siblingsError || !siblings) {
    console.error("reorderMonthlyPriority: failed to load monthly priorities", siblingsError);
    return { status: "error", message: "Couldn't reorder that priority. Please try again." };
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
    supabase.from("life_monthly_priorities").update({ position: neighbor.position }).eq("id", current.id).eq("owner_id", user.id),
    supabase.from("life_monthly_priorities").update({ position: current.position }).eq("id", neighbor.id).eq("owner_id", user.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    console.error("reorderMonthlyPriority: failed to swap position", firstUpdate.error ?? secondUpdate.error);
    return { status: "error", message: "Couldn't reorder that priority. Please try again." };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// Read-only summaries
// ---------------------------------------------------------------------------

export interface WeekSummary {
  /** Non-archived, not-yet-completed tasks due within `[weekStart, weekEnd]`, in `getTasksForCurrentUser`'s own "most urgent first" order. */
  tasksDueThisWeek: LifeTask[];
  /** Not-`completed`/`paused` goals, in `getLifeGoalsForCurrentUser`'s own "most relevant first" order. */
  activeGoals: LifeGoal[];
  /** Today's active habits with progress, `getHabitsProgressForCurrentUser`'s own list - only populated when today falls within `[weekStart, weekEnd]` (`todayInWeek`). */
  habitsToday: HabitWithProgress[];
  /** Today's due routines with items/completions, `getTodaysRoutineItemsForCurrentUser`'s own list - same `todayInWeek` gate as `habitsToday`. */
  routineGroupsToday: TodaysRoutineGroup[];
  /** Whether today's calendar date actually falls within `[weekStart, weekEnd]` - the Weekly Planning page's own signal for whether to render `habitsToday`/`routineGroupsToday` at all (a week entirely in the past or future has neither). */
  todayInWeek: boolean;
}

/**
 * A read-only aggregation for the Weekly Planning view's own "Upcoming this
 * week" summary - never a new source of truth, every field here is pulled
 * straight from `@/lib/life-planner/life-goals`/`life-tasks`/`life-habits`/
 * `life-routines`'s own already-exported functions and filtered/grouped in
 * memory, not a fresh query against `life_tasks`/`life_goals` directly.
 * `weekStart`/`weekEnd` are both inclusive ISO `YYYY-MM-DD` (see
 * `getWeekEnd`).
 */
export async function getWeekSummary(weekStart: string, weekEnd: string): Promise<WeekSummary> {
  const [tasks, goals] = await Promise.all([getTasksForCurrentUser(), getLifeGoalsForCurrentUser()]);

  const tasksDueThisWeek = tasks.filter(
    (task) => task.status !== "completed" && task.dueDate !== null && task.dueDate >= weekStart && task.dueDate <= weekEnd,
  );
  const activeGoals = goals.filter((goal) => goal.status === "not_started" || goal.status === "in_progress");

  const today = todayIso();
  const todayInWeek = today >= weekStart && today <= weekEnd;

  const [habitsToday, routineGroupsToday] = todayInWeek
    ? await Promise.all([getHabitsProgressForCurrentUser(), getTodaysRoutineItemsForCurrentUser()])
    : [[], []];

  return { tasksDueThisWeek, activeGoals, habitsToday, routineGroupsToday, todayInWeek };
}

export interface MonthSummary {
  /** Non-archived, not-yet-completed tasks due within `[monthStart, monthEnd]`, in `getTasksForCurrentUser`'s own "most urgent first" order. */
  tasksDueThisMonth: LifeTask[];
  /** `allActiveGoals` further narrowed to those with a `targetDate` inside `[monthStart, monthEnd]`. */
  activeGoalsWithTargetDatesThisMonth: LifeGoal[];
  /** Every not-`completed`/`paused` goal, regardless of target date - the Monthly Planning view's own "everything still live this month" list, a superset of `activeGoalsWithTargetDatesThisMonth`. */
  allActiveGoals: LifeGoal[];
}

/** A read-only aggregation for the Monthly Planning view's own "This month" summary - the same "compose from existing exported functions" shape `getWeekSummary` uses one level down, at monthly grain. `monthStart`/`monthEnd` are both inclusive ISO `YYYY-MM-DD` (see `getMonthEnd`). */
export async function getMonthSummary(monthStart: string, monthEnd: string): Promise<MonthSummary> {
  const [tasks, goals] = await Promise.all([getTasksForCurrentUser(), getLifeGoalsForCurrentUser()]);

  const tasksDueThisMonth = tasks.filter(
    (task) => task.status !== "completed" && task.dueDate !== null && task.dueDate >= monthStart && task.dueDate <= monthEnd,
  );
  const allActiveGoals = goals.filter((goal) => goal.status === "not_started" || goal.status === "in_progress");
  const activeGoalsWithTargetDatesThisMonth = allActiveGoals.filter(
    (goal) => goal.targetDate !== null && goal.targetDate >= monthStart && goal.targetDate <= monthEnd,
  );

  return { tasksDueThisMonth, activeGoalsWithTargetDatesThisMonth, allActiveGoals };
}

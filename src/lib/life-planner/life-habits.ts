import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LIFE_HABIT_FREQUENCIES, type LifeHabit, type LifeHabitFrequency, type LifeHabitLog } from "@/types/life-planner";

import { getLifeGoalById } from "./life-goals";

/**
 * Habits - `public.life_habits` and `public.life_habit_logs`
 * (`supabase/migrations/20260917000000_life_planner_habits.sql`), the
 * Habits half of "Habits & Routines" (Routines is its own DAL,
 * `@/lib/life-planner/life-routines`, built the phase before this one).
 * Same shape as every other Life Planner DAL: every exported function calls
 * `requireUser()` itself, and RLS (a direct `owner_id = auth.uid()` policy
 * on both tables) independently enforces "only this user's own rows."
 *
 * `server-only`: reads/writes both tables through the server Supabase
 * client. Never safe to import from a Client Component.
 */

const HABIT_COLUMNS = "id, owner_id, life_area_id, goal_id, name, description, frequency, target_per_period, is_active, position, created_at, updated_at";
const LOG_COLUMNS = "id, owner_id, habit_id, logged_on, created_at";

type LifeHabitRow = {
  id: string;
  owner_id: string;
  life_area_id: string | null;
  goal_id: string | null;
  name: string;
  description: string | null;
  frequency: string;
  target_per_period: number;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type LifeHabitLogRow = {
  id: string;
  owner_id: string;
  habit_id: string;
  logged_on: string;
  created_at: string;
};

function mapLifeHabitRow(row: LifeHabitRow): LifeHabit {
  return {
    id: row.id,
    ownerId: row.owner_id,
    lifeAreaId: row.life_area_id,
    goalId: row.goal_id,
    name: row.name,
    description: row.description,
    // Cast, not re-validated: every row this DAL ever writes goes through
    // `frequencySchema` first, and the table's own `check` constraint backs
    // that up at the database layer - the same convention `mapLifeRoutineRow`
    // applies to its own `frequency`.
    frequency: row.frequency as LifeHabitFrequency,
    targetPerPeriod: row.target_per_period,
    isActive: row.is_active,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLifeHabitLogRow(row: LifeHabitLogRow): LifeHabitLog {
  return {
    id: row.id,
    ownerId: row.owner_id,
    habitId: row.habit_id,
    loggedOn: row.logged_on,
    createdAt: row.created_at,
  };
}

/** A `Date` as local-calendar `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Today's local calendar date as `YYYY-MM-DD`. */
function todayIso(): string {
  return toIso(new Date());
}

/** A new `Date` `days` days away from `date` (negative to go backward) - never mutates `date` itself. */
function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The Monday that starts `date`'s own calendar week (Monday-Sunday) - `getDay()` returns 0=Sunday..6=Saturday, so Sunday is the one day that steps back 6 rather than `day - 1`. */
function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Every Habit the current user has, active habits first, then by `position`
 * within each group - the Habits list page's own order, the same "paused
 * items don't clutter the top" shape `getRoutinesForCurrentUser` already
 * establishes for Routines.
 */
export async function getHabitsForCurrentUser(): Promise<LifeHabit[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_habits")
    .select(HABIT_COLUMNS)
    .eq("owner_id", user.id)
    .order("is_active", { ascending: false })
    .order("position", { ascending: true });

  if (error) {
    console.error("getHabitsForCurrentUser: failed to load life habits", error);
    return [];
  }

  return (data ?? []).map(mapLifeHabitRow);
}

/**
 * One Habit by id, owner-scoped - `null` both when no row with that id
 * exists at all and when it belongs to someone else, the same "one honest
 * null covers both cases" shape `getRoutineWithItems` already establishes.
 * The habit detail page's own load.
 */
export async function getHabitById(id: string): Promise<LifeHabit | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_habits").select(HABIT_COLUMNS).eq("id", id).eq("owner_id", user.id).maybeSingle();

  if (error) {
    console.error("getHabitById: failed to load life habit", error);
    return null;
  }

  return data ? mapLifeHabitRow(data) : null;
}

/**
 * Every active Habit linked to `goalId` - the goal detail page's own
 * compact "Habits for this goal" section, the same dedicated
 * purpose-built-query shape `getTasksForGoal` (`@/lib/life-planner/life-tasks`)
 * already establishes for its own equivalent section.
 */
export async function getHabitsForGoal(goalId: string): Promise<LifeHabit[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_habits")
    .select(HABIT_COLUMNS)
    .eq("owner_id", user.id)
    .eq("goal_id", goalId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) {
    console.error("getHabitsForGoal: failed to load habits for goal", error);
    return [];
  }

  return (data ?? []).map(mapLifeHabitRow);
}

/**
 * Every log recorded for `habitId` between `startDate` and `endDate`
 * (inclusive, both ISO `YYYY-MM-DD`) - a simple history view (the habit
 * detail page's own "last 14 days" strip), not this DAL's own progress
 * computation, which instead works from `getHabitsProgressForCurrentUser`'s
 * own wider lookback window.
 */
export async function getHabitLogsInRange(habitId: string, startDate: string, endDate: string): Promise<LifeHabitLog[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_habit_logs")
    .select(LOG_COLUMNS)
    .eq("owner_id", user.id)
    .eq("habit_id", habitId)
    .gte("logged_on", startDate)
    .lte("logged_on", endDate)
    .order("logged_on", { ascending: true });

  if (error) {
    console.error("getHabitLogsInRange: failed to load habit logs", error);
    return [];
  }

  return (data ?? []).map(mapLifeHabitLogRow);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface HabitProgress {
  /** How many of `targetInPeriod` have already been logged within the current period (the day, for `"daily"`; the current Monday-Sunday week, for `"weekly"`/`"x_per_week"`). */
  completedInPeriod: number;
  /** What `completedInPeriod` needs to reach to satisfy the current period. Always `1` for `"daily"` regardless of the habit's own `targetPerPeriod` - see `LifeHabit.targetPerPeriod`'s own comment for why that value is unreachable for a daily habit. */
  targetInPeriod: number;
  /** Consecutive periods (days, or weeks) meeting target, walking backward from `referenceDate`, with no gap - see this function's own comment for the exact rule. */
  currentStreak: number;
}

/**
 * Pure function, no database call - derives `HabitProgress` from a Habit's
 * own logs, so it's equally usable server-side
 * (`getHabitsProgressForCurrentUser` below) and from a client component
 * that already has both in hand, without either needing to thread a
 * Supabase client through.
 *
 * Period definition, deliberately simple (matching `isRoutineDueToday`'s own
 * "documented quirk over bulletproof edge-case handling" register):
 * - `"daily"` - the period is `referenceDate`'s own single calendar day.
 *   `targetInPeriod` is always `1` here, not `habit.targetPerPeriod` -
 *   `life_habit_logs`' own `unique (habit_id, logged_on)` constraint means a
 *   daily habit can only ever log `0` or `1` time in its own one-day
 *   period, so any stored `targetPerPeriod` above `1` would be permanently
 *   unsatisfiable if used here (see `LifeHabit.targetPerPeriod`'s own
 *   comment - the creation/edit forms already prevent that value from ever
 *   being set for a daily habit, but this function enforces the same
 *   invariant defensively, independent of what the row itself holds).
 * - `"weekly"`/`"x_per_week"` - the period is the calendar week (Monday
 *   through Sunday) containing `referenceDate`. `completedInPeriod` is the
 *   count of distinct `loggedOn` dates that fall within that week;
 *   `targetInPeriod` is `habit.targetPerPeriod` as stored.
 *
 * `currentStreak`:
 * - `"daily"` - consecutive calendar days with a log, walking backward from
 *   `referenceDate`. If `referenceDate` itself has no log yet, counting
 *   starts from the day before instead - the day isn't over yet, so an
 *   otherwise-unbroken streak isn't zeroed out just because today hasn't
 *   been logged.
 * - `"weekly"`/`"x_per_week"` - consecutive calendar weeks (same Monday
 *   start) whose own `completedInPeriod` meets `targetInPeriod`, walking
 *   backward from the current week. The same "not over yet" allowance
 *   applies: if the current week hasn't met target yet, counting starts
 *   from the week before.
 *
 * Not bulletproof for timezone boundaries or daylight-saving transitions -
 * this deliberately stays a straightforward walk-backward loop rather than
 * a full calendar library, the same tradeoff Phase 2's own recurrence rule
 * (`isRoutineDueToday`) already accepted.
 */
export function computeHabitProgress(habit: Pick<LifeHabit, "frequency" | "targetPerPeriod">, logs: LifeHabitLog[], referenceDate: Date): HabitProgress {
  const loggedDates = new Set(logs.map((log) => log.loggedOn));

  if (habit.frequency === "daily") {
    const refIso = toIso(referenceDate);
    const completedInPeriod = loggedDates.has(refIso) ? 1 : 0;

    let streak = 0;
    let cursor = loggedDates.has(refIso) ? referenceDate : addDays(referenceDate, -1);
    while (loggedDates.has(toIso(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    return { completedInPeriod, targetInPeriod: 1, currentStreak: streak };
  }

  // "weekly" / "x_per_week" - both share the same Monday-Sunday period math.
  const targetInPeriod = habit.targetPerPeriod;

  function countInWeek(weekStart: Date): number {
    const startIso = toIso(weekStart);
    const endIso = toIso(addDays(weekStart, 6));
    let count = 0;
    for (const logged of loggedDates) {
      if (logged >= startIso && logged <= endIso) count += 1;
    }
    return count;
  }

  const currentWeekStart = startOfWeek(referenceDate);
  const completedInPeriod = countInWeek(currentWeekStart);

  let streak = 0;
  let cursorWeekStart = completedInPeriod >= targetInPeriod ? currentWeekStart : addDays(currentWeekStart, -7);
  while (countInWeek(cursorWeekStart) >= targetInPeriod) {
    streak += 1;
    cursorWeekStart = addDays(cursorWeekStart, -7);
  }

  return { completedInPeriod, targetInPeriod, currentStreak: streak };
}

const PROGRESS_LOOKBACK_DAYS = 60;

export interface HabitWithProgress {
  habit: LifeHabit;
  /** Whether today already has a log - the dashboard/list toggle's own initial checked state, cheaper to read off this than re-deriving it from `progress` at every call site. */
  todayLogged: boolean;
  progress: HabitProgress;
}

/**
 * Every active Habit the current user has, each with today's logged state
 * and `computeHabitProgress`'s own summary - the dashboard's "Today's
 * habits" section and the Habits list page's own per-card progress both
 * read this one function rather than each fetching habits + logs and
 * computing progress separately. Fetches a `PROGRESS_LOOKBACK_DAYS`-day
 * window of logs (enough to always cover the current day/week's own period
 * plus a healthy streak) in one query rather than one query per habit - the
 * same "one grouped-in-memory query beats N small ones" shape
 * `getRoutineItemCountsForCurrentUser` already establishes.
 */
export async function getHabitsProgressForCurrentUser(): Promise<HabitWithProgress[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: habitRows, error: habitsError } = await supabase
    .from("life_habits")
    .select(HABIT_COLUMNS)
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (habitsError) {
    console.error("getHabitsProgressForCurrentUser: failed to load life habits", habitsError);
    return [];
  }

  const habits = (habitRows ?? []).map(mapLifeHabitRow);
  if (habits.length === 0) {
    return [];
  }

  const referenceDate = new Date();
  const lookbackStart = toIso(addDays(referenceDate, -PROGRESS_LOOKBACK_DAYS));
  const habitIds = habits.map((habit) => habit.id);

  const { data: logRows, error: logsError } = await supabase
    .from("life_habit_logs")
    .select(LOG_COLUMNS)
    .eq("owner_id", user.id)
    .in("habit_id", habitIds)
    .gte("logged_on", lookbackStart);

  if (logsError) {
    console.error("getHabitsProgressForCurrentUser: failed to load habit logs", logsError);
    return [];
  }

  const logs = (logRows ?? []).map(mapLifeHabitLogRow);
  const todaysIso = todayIso();

  return habits.map((habit) => {
    const habitLogs = logs.filter((log) => log.habitId === habit.id);
    return {
      habit,
      todayLogged: habitLogs.some((log) => log.loggedOn === todaysIso),
      progress: computeHabitProgress(habit, habitLogs, referenceDate),
    };
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const frequencySchema = z.enum(LIFE_HABIT_FREQUENCIES);

const descriptionSchema = z
  .string()
  .trim()
  .max(300, "Keep it under 300 characters.")
  .optional()
  .transform((value) => (value ? value : null));

// A Life Area/Goal select renders its "none" choice as an empty string
// (Radix `Select.Item` can't take a genuinely empty `value`), so this
// normalizes both "field omitted" and the empty-string sentinel to `null`
// before the real `uuid()` check runs - the same "" -> null normalization
// `life-tasks.ts`'s own `optionalUuidSchema` uses.
const optionalUuidSchema = z
  .union([z.string().trim().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

/** Daily habits can only ever satisfy `1` (see `LifeHabit.targetPerPeriod`'s own comment), so this coerces the stored value the same way regardless of what a caller's form happened to submit - the create/edit forms already hide this field for `"daily"`, this is the defensive backstop at the DAL layer. */
function normalizeTargetPerPeriod(frequency: LifeHabitFrequency, targetPerPeriod: number): number {
  return frequency === "daily" ? 1 : targetPerPeriod;
}

const createHabitSchema = z.object({
  name: z.string().trim().min(1, "Give this habit a name.").max(80, "Keep it under 80 characters."),
  description: descriptionSchema,
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
  frequency: frequencySchema.optional().default("daily"),
  targetPerPeriod: z.coerce.number().int().min(1, "Must be at least 1.").max(14, "Keep it to 14 or fewer.").optional().default(1),
});

export type CreateHabitInput = z.input<typeof createHabitSchema>;

export type LifeHabitMutationResult =
  | { status: "success"; habit: LifeHabit }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Verifies `lifeAreaId` belongs to the current user before letting a habit
 * reference it - `life_areas`' own insert/update policies only check the
 * *habit's* `owner_id`, not that a caller-supplied `life_area_id` actually
 * belongs to that same owner, so an unverified id would let a signed-in
 * user file a habit under any area id they can guess. Same reasoning
 * `verifyLifeAreaOwnership` (`@/lib/life-planner/life-tasks`) documents for
 * its own caller-supplied id - duplicated here rather than imported, the
 * same "each DAL owns its own copy" convention `verifyRoutineOwnership`
 * (`@/lib/life-planner/life-routines`) already follows.
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
 * Verifies `goalId` belongs to the current user before letting a habit
 * reference it - reuses `getLifeGoalById`, which is already owner-scoped (a
 * `null` result covers both "doesn't exist" and "belongs to someone else"),
 * the exact same guard `life-tasks.ts`'s own `verifyGoalOwnership` applies
 * for the same reason.
 */
async function verifyGoalOwnership(goalId: string): Promise<boolean> {
  const goal = await getLifeGoalById(goalId);
  return goal !== null;
}

/** Appends a new Habit to the end of the user's list - the "New habit" form's action. Starts active (`isActive: true`). */
export async function createHabit(input: CreateHabitInput): Promise<LifeHabitMutationResult> {
  const user = await requireUser();

  const parsed = createHabitSchema.safeParse(input);
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

  const { count } = await supabase.from("life_habits").select("id", { count: "exact", head: true }).eq("owner_id", user.id);

  const { data, error } = await supabase
    .from("life_habits")
    .insert({
      owner_id: user.id,
      life_area_id: parsed.data.lifeAreaId,
      goal_id: parsed.data.goalId,
      name: parsed.data.name,
      description: parsed.data.description,
      frequency: parsed.data.frequency,
      target_per_period: normalizeTargetPerPeriod(parsed.data.frequency, parsed.data.targetPerPeriod),
      position: count ?? 0,
    })
    .select(HABIT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createHabit: failed to create life habit", error);
    return { status: "error", message: "Couldn't create that habit. Please try again." };
  }

  return { status: "success", habit: mapLifeHabitRow(data) };
}

const updateHabitSchema = z.object({
  name: z.string().trim().min(1, "Give this habit a name.").max(80, "Keep it under 80 characters.").optional(),
  description: descriptionSchema,
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
  frequency: frequencySchema.optional(),
  targetPerPeriod: z.coerce.number().int().min(1, "Must be at least 1.").max(14, "Keep it to 14 or fewer.").optional(),
});

export type UpdateHabitInput = z.input<typeof updateHabitSchema>;

/**
 * Edits a Habit in place - a partial patch (only the fields actually
 * present in `input` are written), the same "check presence on the raw
 * input, not the parsed output" shape `updateRoutine`/`updateTask` use. If
 * `frequency` is changing to `"daily"` and `targetPerPeriod` wasn't
 * explicitly part of this same edit, `target_per_period` is normalized to
 * `1` alongside it - the same `normalizeTargetPerPeriod` invariant
 * `createHabit` applies at creation time, kept true across edits too rather
 * than left to go stale.
 */
export async function updateHabit(habitId: string, input: UpdateHabitInput): Promise<LifeHabitMutationResult> {
  const user = await requireUser();

  const parsed = updateHabitSchema.safeParse(input);
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
    name?: string;
    description?: string | null;
    life_area_id?: string | null;
    goal_id?: string | null;
    frequency?: LifeHabitFrequency;
    target_per_period?: number;
  } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (Object.hasOwn(input, "description")) patch.description = parsed.data.description;
  if (Object.hasOwn(input, "lifeAreaId")) patch.life_area_id = parsed.data.lifeAreaId;
  if (Object.hasOwn(input, "goalId")) patch.goal_id = parsed.data.goalId;
  if (parsed.data.frequency !== undefined) patch.frequency = parsed.data.frequency;

  const targetPerPeriodProvided = parsed.data.targetPerPeriod !== undefined;
  if (targetPerPeriodProvided) patch.target_per_period = parsed.data.targetPerPeriod;

  if (patch.frequency === "daily") {
    // Always forced to 1 for daily, whether or not this same edit also
    // touched `targetPerPeriod` explicitly - see `normalizeTargetPerPeriod`'s
    // own comment.
    patch.target_per_period = 1;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_habits").update(patch).eq("id", habitId).eq("owner_id", user.id).select(HABIT_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateHabit: failed to update life habit", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", habit: mapLifeHabitRow(data) };
}

/** Pauses a Habit (`isActive: false`) - it stops appearing in "today's habits" but keeps its own log history. The habit list/detail page's own pause toggle. */
export async function deactivateHabit(habitId: string): Promise<LifeHabitMutationResult> {
  return setHabitActive(habitId, false);
}

/** Resumes a paused Habit (`isActive: true`) - the inverse of `deactivateHabit`. */
export async function activateHabit(habitId: string): Promise<LifeHabitMutationResult> {
  return setHabitActive(habitId, true);
}

async function setHabitActive(habitId: string, isActive: boolean): Promise<LifeHabitMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_habits")
    .update({ is_active: isActive })
    .eq("id", habitId)
    .eq("owner_id", user.id)
    .select(HABIT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("setHabitActive: failed to update life habit", error);
    return { status: "error", message: "Couldn't update that habit. Please try again." };
  }

  return { status: "success", habit: mapLifeHabitRow(data) };
}

export type LifeHabitDeleteResult = { status: "success" } | { status: "error"; message: string };

/** Deletes a Habit outright, along with its own log history (`on delete cascade`). No "keep at least one" floor - a habit is optional, the same "a user is free to end up with zero" reasoning `deleteRoutine` already applies. */
export async function deleteHabit(habitId: string): Promise<LifeHabitDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_habits").delete().eq("id", habitId).eq("owner_id", user.id);

  if (error) {
    console.error("deleteHabit: failed to delete life habit", error);
    return { status: "error", message: "Couldn't remove that habit. Please try again." };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export type HabitLogMutationResult = { status: "success"; logged: boolean } | { status: "error"; message: string };

/**
 * Toggles whether `habitId` is logged for `date` (ISO `YYYY-MM-DD`) - insert
 * if no log exists for that habit+date yet, delete if one does, backed by
 * the table's own `unique (habit_id, logged_on)` constraint. The completion
 * toggle's own action, everywhere one appears (the dashboard's "Today's
 * habits" section, the Habits list page, the habit detail page, and a
 * goal's own compact "Habits for this goal" section).
 *
 * Verifies `habitId` belongs to the current user first - the same
 * "caller-supplied id, unverified by the table's own insert policy" guard
 * `toggleRoutineItemCompletion` (`@/lib/life-planner/life-routines`)
 * documents for its own caller-supplied id.
 */
export async function toggleHabitLogForDate(habitId: string, date: string): Promise<HabitLogMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: habit, error: habitError } = await supabase.from("life_habits").select("id").eq("id", habitId).eq("owner_id", user.id).maybeSingle();

  if (habitError || !habit) {
    console.error("toggleHabitLogForDate: failed to load habit", habitError);
    return { status: "error", message: "That habit no longer exists." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("life_habit_logs")
    .select("id")
    .eq("owner_id", user.id)
    .eq("habit_id", habitId)
    .eq("logged_on", date)
    .maybeSingle();

  if (existingError) {
    console.error("toggleHabitLogForDate: failed to check existing log", existingError);
    return { status: "error", message: "Couldn't update that habit. Please try again." };
  }

  if (existing) {
    const { error } = await supabase.from("life_habit_logs").delete().eq("id", existing.id);
    if (error) {
      console.error("toggleHabitLogForDate: failed to delete log", error);
      return { status: "error", message: "Couldn't update that habit. Please try again." };
    }
    return { status: "success", logged: false };
  }

  const { error } = await supabase.from("life_habit_logs").insert({ owner_id: user.id, habit_id: habitId, logged_on: date });
  if (error) {
    console.error("toggleHabitLogForDate: failed to create log", error);
    return { status: "error", message: "Couldn't update that habit. Please try again." };
  }
  return { status: "success", logged: true };
}

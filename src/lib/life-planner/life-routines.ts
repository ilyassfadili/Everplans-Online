import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LIFE_ROUTINE_FREQUENCIES,
  LIFE_ROUTINE_TYPES,
  type LifeRoutine,
  type LifeRoutineCompletion,
  type LifeRoutineFrequency,
  type LifeRoutineItem,
  type LifeRoutineType,
} from "@/types/life-planner";

/**
 * Routines - `public.life_routines`, `public.life_routine_items`, and
 * `public.life_routine_completions`
 * (`supabase/migrations/20260916000000_life_planner_routines.sql`), the
 * Routines half of "Habits & Routines" (Habits is its own DAL, added in a
 * later phase). Same shape as `@/lib/life-planner/life-tasks`: every
 * exported function calls `requireUser()` itself, and RLS (a direct
 * `owner_id = auth.uid()` policy on all three tables) independently
 * enforces "only this user's own rows."
 *
 * `server-only`: reads/writes all three tables through the server Supabase
 * client. Never safe to import from a Client Component.
 */

const ROUTINE_COLUMNS = "id, owner_id, name, purpose, routine_type, frequency, active_days, is_active, position, created_at, updated_at";
const ITEM_COLUMNS = "id, owner_id, routine_id, title, position, created_at, updated_at";
const COMPLETION_COLUMNS = "id, owner_id, routine_item_id, completed_on, created_at";

type LifeRoutineRow = {
  id: string;
  owner_id: string;
  name: string;
  purpose: string | null;
  routine_type: string;
  frequency: string;
  active_days: number[];
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type LifeRoutineItemRow = {
  id: string;
  owner_id: string;
  routine_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type LifeRoutineCompletionRow = {
  id: string;
  owner_id: string;
  routine_item_id: string;
  completed_on: string;
  created_at: string;
};

function mapLifeRoutineRow(row: LifeRoutineRow): LifeRoutine {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    purpose: row.purpose,
    // Cast, not re-validated: every row this DAL ever writes goes through
    // `routineTypeSchema`/`frequencySchema` first, and the table's own
    // `check` constraints back that up at the database layer - the same
    // convention `mapLifeTaskRow` applies to its own `status`/`priority`.
    routineType: row.routine_type as LifeRoutineType,
    frequency: row.frequency as LifeRoutineFrequency,
    activeDays: row.active_days,
    isActive: row.is_active,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLifeRoutineItemRow(row: LifeRoutineItemRow): LifeRoutineItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    routineId: row.routine_id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLifeRoutineCompletionRow(row: LifeRoutineCompletionRow): LifeRoutineCompletion {
  return {
    id: row.id,
    ownerId: row.owner_id,
    routineItemId: row.routine_item_id,
    completedOn: row.completed_on,
    createdAt: row.created_at,
  };
}

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction `life-tasks.ts`'s own `todayIso` uses). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Every Routine the current user has, active routines first, then by
 * `position` within each group - the Routines list page's own order, so a
 * paused routine doesn't clutter the top of the list above the ones still
 * in use.
 */
export async function getRoutinesForCurrentUser(): Promise<LifeRoutine[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_routines")
    .select(ROUTINE_COLUMNS)
    .eq("owner_id", user.id)
    .order("is_active", { ascending: false })
    .order("position", { ascending: true });

  if (error) {
    console.error("getRoutinesForCurrentUser: failed to load life routines", error);
    return [];
  }

  return (data ?? []).map(mapLifeRoutineRow);
}

/**
 * How many items each of the current user's Routines has - the Routines
 * list page's own per-card count, one grouped-in-memory query rather than a
 * per-routine query in the list's own map, the same shape
 * `getLifeGoalCountsByArea` (`@/lib/life-planner/life-goals`) already
 * establishes for an analogous per-parent count.
 */
export async function getRoutineItemCountsForCurrentUser(): Promise<Map<string, number>> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_routine_items").select("routine_id").eq("owner_id", user.id);

  if (error) {
    console.error("getRoutineItemCountsForCurrentUser: failed to load routine item counts", error);
    return new Map();
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.routine_id, (counts.get(row.routine_id) ?? 0) + 1);
  }

  return counts;
}

/**
 * One Routine plus its own items (in `position` order), owner-scoped -
 * `null` both when no row with that id exists at all and when it belongs to
 * someone else, the same "one honest null covers both cases" shape
 * `getLifeGoalById` already establishes. The routine detail page's own load.
 */
export async function getRoutineWithItems(routineId: string): Promise<{ routine: LifeRoutine; items: LifeRoutineItem[] } | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: routineRow, error: routineError } = await supabase
    .from("life_routines")
    .select(ROUTINE_COLUMNS)
    .eq("id", routineId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (routineError) {
    console.error("getRoutineWithItems: failed to load routine", routineError);
    return null;
  }
  if (!routineRow) {
    return null;
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from("life_routine_items")
    .select(ITEM_COLUMNS)
    .eq("owner_id", user.id)
    .eq("routine_id", routineId)
    .order("position", { ascending: true });

  if (itemsError) {
    console.error("getRoutineWithItems: failed to load routine items", itemsError);
    return null;
  }

  return { routine: mapLifeRoutineRow(routineRow), items: (itemRows ?? []).map(mapLifeRoutineItemRow) };
}

// ---------------------------------------------------------------------------
// Recurrence
// ---------------------------------------------------------------------------

/**
 * Whether `routine` is due on `today` - a pure function, no database call,
 * so it's equally usable server-side (`getTodaysRoutineItemsForCurrentUser`
 * below) and in a future client-side preview without either needing to
 * thread a Supabase client through.
 *
 * The recurrence rule, deliberately simple (Phase 2's own instruction to
 * keep this simple and documented rather than modeling a full RFC 5545
 * recurrence grammar):
 * - `"daily"` - always due.
 * - `"weekdays"` - due Monday through Friday (`getDay()` 1-5).
 * - `"weekly"`/`"custom"` - both reduce to the exact same check: due
 *   whichever days of the week `activeDays` names. A single "weekly" flag
 *   can't express *which* day on its own, so rather than this function
 *   guessing one, "weekly" is really just "custom, scheduled via the same
 *   day picker" - the UI's only difference between the two is which one a
 *   user picks to describe intent ("this repeats every week" vs. "this
 *   repeats on a specific pattern"), not a different underlying rule. A
 *   routine with no `activeDays` chosen yet is simply never due, not a
 *   guessed default.
 *
 * Also returns `false` outright for a paused (`isActive: false`) routine -
 * every call site of this function already filters to active routines
 * first (for a cheaper query), but this defensive check means the function
 * is still correct on its own if that filter is ever skipped.
 */
export function isRoutineDueToday(routine: LifeRoutine, today: Date): boolean {
  if (!routine.isActive) {
    return false;
  }

  const dayOfWeek = today.getDay();

  switch (routine.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekly":
    case "custom":
      return routine.activeDays.includes(dayOfWeek);
    default:
      return false;
  }
}

export interface TodaysRoutineGroup {
  routine: LifeRoutine;
  items: LifeRoutineItem[];
  completions: LifeRoutineCompletion[];
}

/**
 * Every active Routine due today (`isRoutineDueToday`), each with its own
 * items and today's completions joined in - the dashboard's own "Today's
 * routines" section, and the routine detail page's own "Today's checklist"
 * mini-section (which further narrows this down to the one routine it
 * cares about). A routine due today but with no items yet is skipped - an
 * empty checklist has nothing useful to show either place this is rendered.
 */
export async function getTodaysRoutineItemsForCurrentUser(): Promise<TodaysRoutineGroup[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: routineRows, error: routinesError } = await supabase
    .from("life_routines")
    .select(ROUTINE_COLUMNS)
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (routinesError) {
    console.error("getTodaysRoutineItemsForCurrentUser: failed to load life routines", routinesError);
    return [];
  }

  const today = new Date();
  const dueRoutines = (routineRows ?? []).map(mapLifeRoutineRow).filter((routine) => isRoutineDueToday(routine, today));

  if (dueRoutines.length === 0) {
    return [];
  }

  const routineIds = dueRoutines.map((routine) => routine.id);

  const [itemsResult, completionsResult] = await Promise.all([
    supabase.from("life_routine_items").select(ITEM_COLUMNS).eq("owner_id", user.id).in("routine_id", routineIds).order("position", { ascending: true }),
    supabase.from("life_routine_completions").select(COMPLETION_COLUMNS).eq("owner_id", user.id).eq("completed_on", todayIso()),
  ]);

  if (itemsResult.error || completionsResult.error) {
    console.error("getTodaysRoutineItemsForCurrentUser: failed to load routine items/completions", itemsResult.error ?? completionsResult.error);
    return [];
  }

  const items = (itemsResult.data ?? []).map(mapLifeRoutineItemRow);
  const completions = (completionsResult.data ?? []).map(mapLifeRoutineCompletionRow);

  const groups: TodaysRoutineGroup[] = [];
  for (const routine of dueRoutines) {
    const routineItems = items.filter((item) => item.routineId === routine.id);
    if (routineItems.length === 0) continue;

    const routineItemIds = new Set(routineItems.map((item) => item.id));
    const routineCompletions = completions.filter((completion) => routineItemIds.has(completion.routineItemId));

    groups.push({ routine, items: routineItems, completions: routineCompletions });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Routine mutations
// ---------------------------------------------------------------------------

const routineTypeSchema = z.enum(LIFE_ROUTINE_TYPES);
const frequencySchema = z.enum(LIFE_ROUTINE_FREQUENCIES);

const purposeSchema = z
  .string()
  .trim()
  .max(300, "Keep it under 300 characters.")
  .optional()
  .transform((value) => (value ? value : null));

const activeDaysSchema = z
  .array(z.number().int().min(0, "Days run 0 (Sunday) through 6 (Saturday).").max(6, "Days run 0 (Sunday) through 6 (Saturday)."))
  .optional()
  .default([])
  .transform((days) => Array.from(new Set(days)).sort((a, b) => a - b));

/** `activeDays` only means anything for `"weekly"`/`"custom"` - normalized to `[]` for `"daily"`/`"weekdays"` so the invariant documented on `LifeRoutine.activeDays` is actually enforced here, not just left to callers to respect. */
function normalizeActiveDays(frequency: LifeRoutineFrequency, activeDays: number[]): number[] {
  return frequency === "weekly" || frequency === "custom" ? activeDays : [];
}

const createRoutineSchema = z.object({
  name: z.string().trim().min(1, "Give this routine a name.").max(80, "Keep it under 80 characters."),
  purpose: purposeSchema,
  routineType: routineTypeSchema.optional().default("custom"),
  frequency: frequencySchema.optional().default("daily"),
  activeDays: activeDaysSchema,
});

export type CreateRoutineInput = z.input<typeof createRoutineSchema>;

export type LifeRoutineMutationResult =
  | { status: "success"; routine: LifeRoutine }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Appends a new Routine to the end of the user's list - the "New routine" form's action. Starts active (`isActive: true`) and with zero items; adding items is the routine detail page's own job right after creation. */
export async function createRoutine(input: CreateRoutineInput): Promise<LifeRoutineMutationResult> {
  const user = await requireUser();

  const parsed = createRoutineSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase.from("life_routines").select("id", { count: "exact", head: true }).eq("owner_id", user.id);

  const { data, error } = await supabase
    .from("life_routines")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      purpose: parsed.data.purpose,
      routine_type: parsed.data.routineType,
      frequency: parsed.data.frequency,
      active_days: normalizeActiveDays(parsed.data.frequency, parsed.data.activeDays),
      position: count ?? 0,
    })
    .select(ROUTINE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createRoutine: failed to create routine", error);
    return { status: "error", message: "Couldn't create that routine. Please try again." };
  }

  return { status: "success", routine: mapLifeRoutineRow(data) };
}

const updateRoutineSchema = z.object({
  name: z.string().trim().min(1, "Give this routine a name.").max(80, "Keep it under 80 characters.").optional(),
  purpose: purposeSchema,
  routineType: routineTypeSchema.optional(),
  frequency: frequencySchema.optional(),
  activeDays: activeDaysSchema,
});

export type UpdateRoutineInput = z.input<typeof updateRoutineSchema>;

/**
 * Edits a Routine in place - a partial patch (only the fields actually
 * present in `input` are written), the same "check presence on the raw
 * input, not the parsed output" shape `updateTask` uses. If `frequency` is
 * changing to `"daily"`/`"weekdays"` and `activeDays` wasn't explicitly
 * part of this same edit, `active_days` is cleared alongside it - the same
 * `normalizeActiveDays` invariant `createRoutine` applies at creation time,
 * kept true across edits too rather than left to go stale.
 */
export async function updateRoutine(routineId: string, input: UpdateRoutineInput): Promise<LifeRoutineMutationResult> {
  const user = await requireUser();

  const parsed = updateRoutineSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    purpose?: string | null;
    routine_type?: LifeRoutineType;
    frequency?: LifeRoutineFrequency;
    active_days?: number[];
  } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (Object.hasOwn(input, "purpose")) patch.purpose = parsed.data.purpose;
  if (parsed.data.routineType !== undefined) patch.routine_type = parsed.data.routineType;
  if (parsed.data.frequency !== undefined) patch.frequency = parsed.data.frequency;

  const activeDaysProvided = Object.hasOwn(input, "activeDays");
  if (activeDaysProvided) patch.active_days = parsed.data.activeDays;

  if (patch.frequency !== undefined) {
    if (patch.frequency === "daily" || patch.frequency === "weekdays") {
      // Always clears for daily/weekdays, whether or not this same edit
      // explicitly touched `activeDays` too - the routine detail page's own
      // edit form (`RoutineDetailView`) always sends its current
      // `activeDays` state alongside `frequency`, even right after the user
      // switches the frequency dropdown away from weekly/custom, so relying
      // on "was activeDays provided" alone would silently keep a stale day
      // selection around under a frequency that's supposed to ignore it.
      patch.active_days = [];
    } else if (!activeDaysProvided) {
      // weekly/custom with no explicit `activeDays` in this same edit - the
      // existing row's own `active_days` is left untouched, since `[]` here
      // would otherwise wipe out a selection the user isn't touching in
      // this particular save.
      delete patch.active_days;
    }
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_routines").update(patch).eq("id", routineId).eq("owner_id", user.id).select(ROUTINE_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateRoutine: failed to update routine", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", routine: mapLifeRoutineRow(data) };
}

/** Pauses a Routine (`isActive: false`) - it stops appearing in "today's routines" but keeps its items and completion history. The routine detail/list page's own pause toggle. */
export async function deactivateRoutine(routineId: string): Promise<LifeRoutineMutationResult> {
  return setRoutineActive(routineId, false);
}

/** Resumes a paused Routine (`isActive: true`) - the inverse of `deactivateRoutine`. */
export async function activateRoutine(routineId: string): Promise<LifeRoutineMutationResult> {
  return setRoutineActive(routineId, true);
}

async function setRoutineActive(routineId: string, isActive: boolean): Promise<LifeRoutineMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_routines")
    .update({ is_active: isActive })
    .eq("id", routineId)
    .eq("owner_id", user.id)
    .select(ROUTINE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("setRoutineActive: failed to update routine", error);
    return { status: "error", message: "Couldn't update that routine. Please try again." };
  }

  return { status: "success", routine: mapLifeRoutineRow(data) };
}

export type LifeRoutineDeleteResult = { status: "success" } | { status: "error"; message: string };

/** Deletes a Routine outright, along with its items and completion history (`on delete cascade` on both child tables). No "keep at least one" floor - a routine is optional, unlike a Life Area, so a user is free to end up with zero. */
export async function deleteRoutine(routineId: string): Promise<LifeRoutineDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_routines").delete().eq("id", routineId).eq("owner_id", user.id);

  if (error) {
    console.error("deleteRoutine: failed to delete routine", error);
    return { status: "error", message: "Couldn't remove that routine. Please try again." };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// Routine item mutations
// ---------------------------------------------------------------------------

/**
 * Verifies `routineId` belongs to the current user before letting an item
 * mutation touch it - `life_routine_items`' own insert policy only checks
 * the new row's `owner_id`, not that a caller-supplied `routine_id`
 * actually belongs to that same owner, so an unverified id would let a
 * signed-in user attach an item to any routine id they can guess. Same
 * reasoning `verifyLifeAreaOwnership` (`@/lib/life-planner/life-tasks`)
 * documents for its own caller-supplied id.
 */
async function verifyRoutineOwnership(routineId: string, ownerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("life_routines").select("id").eq("id", routineId).eq("owner_id", ownerId).maybeSingle();

  if (error) {
    console.error("verifyRoutineOwnership: failed to check routine", error);
    return false;
  }

  return data !== null;
}

const routineItemTitleSchema = z.string().trim().min(1, "Give this item a title.").max(120, "Keep it under 120 characters.");

export type LifeRoutineItemMutationResult =
  | { status: "success"; item: LifeRoutineItem }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Appends a new Item to the end of `routineId`'s own list - the routine detail page's own "Add item" form. */
export async function addRoutineItem(routineId: string, title: string): Promise<LifeRoutineItemMutationResult> {
  const user = await requireUser();

  const parsed = routineItemTitleSchema.safeParse(title);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (!(await verifyRoutineOwnership(routineId, user.id))) {
    return { status: "error", message: "That routine no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase.from("life_routine_items").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("routine_id", routineId);

  const { data, error } = await supabase
    .from("life_routine_items")
    .insert({ owner_id: user.id, routine_id: routineId, title: parsed.data, position: count ?? 0 })
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("addRoutineItem: failed to create routine item", error);
    return { status: "error", message: "Couldn't add that item. Please try again." };
  }

  return { status: "success", item: mapLifeRoutineItemRow(data) };
}

/** Renames an Item in place - the only field a routine item has besides its position, so this is a full replace rather than a partial patch. */
export async function updateRoutineItem(itemId: string, title: string): Promise<LifeRoutineItemMutationResult> {
  const user = await requireUser();

  const parsed = routineItemTitleSchema.safeParse(title);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_routine_items")
    .update({ title: parsed.data })
    .eq("id", itemId)
    .eq("owner_id", user.id)
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateRoutineItem: failed to update routine item", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", item: mapLifeRoutineItemRow(data) };
}

/** Deletes an Item outright, along with its own completion history (`on delete cascade`). */
export async function deleteRoutineItem(itemId: string): Promise<LifeRoutineDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_routine_items").delete().eq("id", itemId).eq("owner_id", user.id);

  if (error) {
    console.error("deleteRoutineItem: failed to delete routine item", error);
    return { status: "error", message: "Couldn't remove that item. Please try again." };
  }

  return { status: "success" };
}

/** Swaps one Item's `position` with its neighbor within the same routine - the same "load the group, find the neighbor, swap" shape `reorderMilestone` (`@/lib/life-planner/life-goal-planning`) uses, scoped to `routine_id` instead of `goal_id`. `direction: "up"` moves toward the start of the list. */
export async function reorderRoutineItem(itemId: string, direction: "up" | "down"): Promise<LifeRoutineDeleteResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("life_routine_items")
    .select("id, routine_id")
    .eq("id", itemId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (targetError || !target) {
    console.error("reorderRoutineItem: failed to load routine item", targetError);
    return { status: "error", message: "That item no longer exists." };
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("life_routine_items")
    .select("id, position")
    .eq("owner_id", user.id)
    .eq("routine_id", target.routine_id)
    .order("position", { ascending: true });

  if (siblingsError || !siblings) {
    console.error("reorderRoutineItem: failed to load routine items", siblingsError);
    return { status: "error", message: "Couldn't reorder that item. Please try again." };
  }

  const currentIndex = siblings.findIndex((row) => row.id === itemId);
  const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const neighbor = siblings[neighborIndex];

  if (currentIndex === -1 || !neighbor) {
    // Already at the edge of the list (or gone) - not an error, just nothing to do.
    return { status: "success" };
  }

  const current = siblings[currentIndex]!;

  const [firstUpdate, secondUpdate] = await Promise.all([
    supabase.from("life_routine_items").update({ position: neighbor.position }).eq("id", current.id).eq("owner_id", user.id),
    supabase.from("life_routine_items").update({ position: current.position }).eq("id", neighbor.id).eq("owner_id", user.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    console.error("reorderRoutineItem: failed to swap position", firstUpdate.error ?? secondUpdate.error);
    return { status: "error", message: "Couldn't reorder that item. Please try again." };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

export type RoutineCompletionMutationResult = { status: "success"; completed: boolean } | { status: "error"; message: string };

/**
 * Toggles whether `routineItemId` is marked done for `date` (ISO
 * `YYYY-MM-DD`) - insert if no completion exists for that item+date yet,
 * delete if one does, backed by the table's own `unique (routine_item_id,
 * completed_on)` constraint. The completion checkbox's own action,
 * everywhere one appears (the dashboard's "Today's routines" section, the
 * routine detail page's own "Today's checklist").
 *
 * Verifies `routineItemId` belongs to the current user first - the same
 * "caller-supplied id, unverified by the table's own insert policy" guard
 * `verifyRoutineOwnership` documents just above, here applied to the item a
 * completion references rather than the routine an item references.
 */
export async function toggleRoutineItemCompletion(routineItemId: string, date: string): Promise<RoutineCompletionMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: item, error: itemError } = await supabase.from("life_routine_items").select("id").eq("id", routineItemId).eq("owner_id", user.id).maybeSingle();

  if (itemError || !item) {
    console.error("toggleRoutineItemCompletion: failed to load routine item", itemError);
    return { status: "error", message: "That checklist item no longer exists." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("life_routine_completions")
    .select("id")
    .eq("owner_id", user.id)
    .eq("routine_item_id", routineItemId)
    .eq("completed_on", date)
    .maybeSingle();

  if (existingError) {
    console.error("toggleRoutineItemCompletion: failed to check existing completion", existingError);
    return { status: "error", message: "Couldn't update that checklist item. Please try again." };
  }

  if (existing) {
    const { error } = await supabase.from("life_routine_completions").delete().eq("id", existing.id);
    if (error) {
      console.error("toggleRoutineItemCompletion: failed to delete completion", error);
      return { status: "error", message: "Couldn't update that checklist item. Please try again." };
    }
    return { status: "success", completed: false };
  }

  const { error } = await supabase.from("life_routine_completions").insert({ owner_id: user.id, routine_item_id: routineItemId, completed_on: date });
  if (error) {
    console.error("toggleRoutineItemCompletion: failed to create completion", error);
    return { status: "error", message: "Couldn't update that checklist item. Please try again." };
  }
  return { status: "success", completed: true };
}

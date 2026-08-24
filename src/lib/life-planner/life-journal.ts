import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LifeJournalEntry } from "@/types/life-planner";

import { getLifeGoalById } from "./life-goals";

/**
 * Journal - `public.life_journal_entries`
 * (`supabase/migrations/20260919000000_life_planner_journal.sql`), Life
 * Planner Prompt 4 Phase 2. Same shape as every other Life Planner DAL:
 * every exported function calls `requireUser()` itself, and RLS (a direct
 * `owner_id = auth.uid()` policy) independently enforces "only this user's
 * own entries."
 *
 * This is the most sensitive personal data in the entire product - private
 * reflective writing. RLS is the *only* access boundary this table has (see
 * the migration's own comment) - there is no service-role client anywhere
 * in this file, and there must never be one added here without a deliberate,
 * separate decision to do so.
 *
 * `server-only`: reads/writes `public.life_journal_entries` through the
 * server Supabase client. Never safe to import from a Client Component.
 */

const JOURNAL_COLUMNS = "id, owner_id, title, content, entry_date, life_area_id, goal_id, is_archived, created_at, updated_at";

type LifeJournalEntryRow = {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  entry_date: string;
  life_area_id: string | null;
  goal_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

function mapLifeJournalEntryRow(row: LifeJournalEntryRow): LifeJournalEntry {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    content: row.content,
    entryDate: row.entry_date,
    lifeAreaId: row.life_area_id,
    goalId: row.goal_id,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Escapes `%`/`_` (Postgres `ilike`'s own wildcard characters) inside a
 * user-typed search string before it's interpolated into an `.or(...)`
 * filter string below - without this, a search for e.g. "50%" would match
 * far more than intended, since `%` means "any run of characters" to
 * `ilike`, not a literal percent sign.
 */
function escapeIlikeSpecialChars(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

export interface GetJournalEntriesOptions {
  /** Include archived entries - `false` (the default) is every real view of the journal list; only the "view archived" toggle passes `true`. */
  includeArchived?: boolean;
  /** Narrow to entries filed under one Life Area. */
  lifeAreaId?: string;
  /** Narrow to entries linked to one Goal - the goal detail page's own "Journal reflections" section. */
  goalId?: string;
  /**
   * A lightweight `ilike` match against `title` and `content` - deliberately
   * not a dedicated search index/extension (Postgres full-text search,
   * trigram, or an external search service): the phase brief is explicit
   * that this table doesn't warrant that infrastructure, and a plain
   * `ilike` scan is more than adequate at the "one user's own journal"
   * scale this table will ever see.
   */
  search?: string;
}

/**
 * Every Journal Entry the current user has, newest `entryDate` first (ties
 * broken by `createdAt`, most recent first) - the Journal list's own read,
 * and (narrowed via `goalId`) the goal detail page's "Journal reflections"
 * section. Excludes archived entries by default, the same "archive is this
 * table's soft-delete, hidden from every ordinary view" convention
 * `getTasksForCurrentUser` already establishes for `life_tasks`.
 */
export async function getJournalEntriesForCurrentUser(opts: GetJournalEntriesOptions = {}): Promise<LifeJournalEntry[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("life_journal_entries").select(JOURNAL_COLUMNS).eq("owner_id", user.id);

  if (!opts.includeArchived) {
    query = query.eq("is_archived", false);
  }
  if (opts.lifeAreaId) {
    query = query.eq("life_area_id", opts.lifeAreaId);
  }
  if (opts.goalId) {
    query = query.eq("goal_id", opts.goalId);
  }
  const trimmedSearch = opts.search?.trim();
  if (trimmedSearch) {
    const escaped = escapeIlikeSpecialChars(trimmedSearch);
    query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
  }

  const { data, error } = await query.order("entry_date", { ascending: false }).order("created_at", { ascending: false });

  if (error) {
    console.error("getJournalEntriesForCurrentUser: failed to load journal entries", error);
    return [];
  }

  return (data ?? []).map(mapLifeJournalEntryRow);
}

/**
 * One Journal Entry by id, owner-scoped - `null` both when no row with that
 * id exists at all and when it belongs to someone else (RLS already
 * prevents the latter from ever returning data, and the explicit
 * `owner_id` filter here is the same belt-and-suspenders confirmation
 * `getLifeGoalById`/`getTaskById` already apply one table over). Given how
 * sensitive this table is, this double-check matters more here than
 * anywhere else in the product.
 */
export async function getJournalEntryById(id: string): Promise<LifeJournalEntry | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_journal_entries").select(JOURNAL_COLUMNS).eq("id", id).eq("owner_id", user.id).maybeSingle();

  if (error) {
    console.error("getJournalEntryById: failed to load journal entry", error);
    return null;
  }

  return data ? mapLifeJournalEntryRow(data) : null;
}

const RECENT_JOURNAL_ENTRIES_LIMIT = 3;

/**
 * Up to `limit` non-archived Journal Entries, newest `entryDate` first - the
 * dashboard's own "Recent reflections" preview. A dedicated, narrowly
 * limited query rather than slicing `getJournalEntriesForCurrentUser()`'s
 * full result, the same "purpose-built query for a dashboard preview" shape
 * `getTodaysPrioritiesForCurrentUser` (`@/lib/life-planner/life-tasks`)
 * already establishes.
 */
export async function getRecentJournalEntriesForCurrentUser(limit = RECENT_JOURNAL_ENTRIES_LIMIT): Promise<LifeJournalEntry[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_journal_entries")
    .select(JOURNAL_COLUMNS)
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentJournalEntriesForCurrentUser: failed to load recent journal entries", error);
    return [];
  }

  return (data ?? []).map(mapLifeJournalEntryRow);
}

const titleSchema = z.string().trim().min(1, "Give this entry a title.").max(140, "Keep it under 140 characters.");
const contentSchema = z.string().trim().min(1, "Write something before saving.").max(10000, "Keep it under 10,000 characters.");

// Deliberately transforms an empty/omitted value to `undefined`, not `null`
// - `entry_date` is `not null default current_date` at the database layer,
// so "not provided" means "let the column's own default apply" (create) or
// "leave it unchanged" (update), never "explicitly clear it" the way `null`
// means for every genuinely nullable date column elsewhere in this product
// (e.g. `targetDateSchema`, `@/lib/life-planner/life-goals`).
const entryDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

// A Life Area/Goal select renders its "none" choice as an empty string
// (Radix `Select.Item` can't take a genuinely empty `value`), so this
// normalizes both "field omitted" and the empty-string sentinel to `null`
// before the real `uuid()` check runs - the same "" -> null normalization
// `life-goals.ts`'s own `lifeAreaIdSchema` and `life-tasks.ts`'s own
// `optionalUuidSchema` already use.
const optionalUuidSchema = z
  .union([z.string().trim().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

/**
 * Verifies `lifeAreaId` belongs to the current user before letting an entry
 * reference it - `life_areas`' own insert/update policies only check the
 * *entry's* `owner_id`, not that a caller-supplied `life_area_id` actually
 * belongs to that same owner, so an unverified id would let a signed-in
 * user file an entry under any area id they can guess. Same reasoning
 * `verifyLifeAreaOwnership` (`@/lib/life-planner/life-tasks`) documents for
 * its own caller-supplied `lifeAreaId`.
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
 * Verifies `goalId` belongs to the current user before letting an entry
 * reference it - reuses `getLifeGoalById`, which is already owner-scoped (a
 * `null` result covers both "doesn't exist" and "belongs to someone else"),
 * the exact same guard `verifyGoalOwnership` (`@/lib/life-planner/life-tasks`)
 * already applies for the same reason.
 */
async function verifyGoalOwnership(goalId: string): Promise<boolean> {
  const goal = await getLifeGoalById(goalId);
  return goal !== null;
}

const createJournalEntrySchema = z.object({
  title: titleSchema,
  content: contentSchema,
  entryDate: entryDateSchema,
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
});

export type CreateJournalEntryInput = z.input<typeof createJournalEntrySchema>;

export type LifeJournalEntryMutationResult =
  | { status: "success"; entry: LifeJournalEntry }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates a new Journal Entry for the current user - the composer's own
 * "Save" action. Cross-user isolation for `lifeAreaId`/`goalId`: both are
 * verified against the current user before the insert proceeds, the same
 * guard `createTask` (`@/lib/life-planner/life-tasks`) already applies for
 * the same two optional filing references.
 */
export async function createJournalEntry(input: CreateJournalEntryInput): Promise<LifeJournalEntryMutationResult> {
  const user = await requireUser();

  const parsed = createJournalEntrySchema.safeParse(input);
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

  const insertPayload: {
    owner_id: string;
    title: string;
    content: string;
    entry_date?: string;
    life_area_id: string | null;
    goal_id: string | null;
  } = {
    owner_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    life_area_id: parsed.data.lifeAreaId,
    goal_id: parsed.data.goalId,
  };
  // Omitted (not set to `undefined` explicitly here twice over) so the
  // column's own `default current_date` applies - see `entryDateSchema`'s
  // own comment.
  if (parsed.data.entryDate) {
    insertPayload.entry_date = parsed.data.entryDate;
  }

  const { data, error } = await supabase.from("life_journal_entries").insert(insertPayload).select(JOURNAL_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("createJournalEntry: failed to create journal entry", error);
    return { status: "error", message: "Couldn't save that entry. Please try again." };
  }

  return { status: "success", entry: mapLifeJournalEntryRow(data) };
}

const updateJournalEntrySchema = z.object({
  title: titleSchema.optional(),
  content: contentSchema.optional(),
  entryDate: entryDateSchema,
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
});

export type UpdateJournalEntryInput = z.input<typeof updateJournalEntrySchema>;

/**
 * Edits a Journal Entry in place - a partial patch (only the fields
 * actually present in `input` are written), the same "check presence on
 * the raw input, not the parsed output" shape `updateLifeGoal`/`updateTask`
 * use. `entryDate` only ever moves the entry to a real date - since the
 * column is `not null`, a blank/omitted `entryDate` leaves the existing
 * date untouched rather than attempting to null it out.
 */
export async function updateJournalEntry(id: string, input: UpdateJournalEntryInput): Promise<LifeJournalEntryMutationResult> {
  const user = await requireUser();

  const parsed = updateJournalEntrySchema.safeParse(input);
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
    content?: string;
    entry_date?: string;
    life_area_id?: string | null;
    goal_id?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.content !== undefined) patch.content = parsed.data.content;
  if (parsed.data.entryDate !== undefined) patch.entry_date = parsed.data.entryDate;
  if (Object.hasOwn(input, "lifeAreaId")) patch.life_area_id = parsed.data.lifeAreaId;
  if (Object.hasOwn(input, "goalId")) patch.goal_id = parsed.data.goalId;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_journal_entries").update(patch).eq("id", id).eq("owner_id", user.id).select(JOURNAL_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateJournalEntry: failed to update journal entry", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", entry: mapLifeJournalEntryRow(data) };
}

/**
 * Archives a Journal Entry - sets `isArchived: true`, leaving the row (and
 * its content) in place. This table's primary "remove from view" affordance,
 * the same role `archiveTask` (`@/lib/life-planner/life-tasks`) plays for
 * `life_tasks` - see `deleteJournalEntry` below for the plain hard delete
 * this deliberately isn't.
 */
export async function archiveJournalEntry(id: string): Promise<LifeJournalEntryMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_journal_entries")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(JOURNAL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("archiveJournalEntry: failed to archive journal entry", error);
    return { status: "error", message: "Couldn't archive that entry. Please try again." };
  }

  return { status: "success", entry: mapLifeJournalEntryRow(data) };
}

/** Un-archives a Journal Entry - the inverse of `archiveJournalEntry`, offered wherever an archived entry appears. */
export async function unarchiveJournalEntry(id: string): Promise<LifeJournalEntryMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_journal_entries")
    .update({ is_archived: false })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(JOURNAL_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("unarchiveJournalEntry: failed to unarchive journal entry", error);
    return { status: "error", message: "Couldn't restore that entry. Please try again." };
  }

  return { status: "success", entry: mapLifeJournalEntryRow(data) };
}

export type DeleteJournalEntryResult = { status: "success" } | { status: "error"; message: string };

/**
 * Deletes a Journal Entry outright - kept for parity with every other Life
 * Planner DAL, and offered as a genuine "permanently remove" affordance
 * (Phase 2's own "delete/archive where appropriate" wording) alongside
 * `archiveJournalEntry`, the same "archive is primary, delete is still
 * real" shape `deleteTask` documents one table over. No "keep at least
 * one" floor - a user is free to end up with zero entries.
 */
export async function deleteJournalEntry(id: string): Promise<DeleteJournalEntryResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_journal_entries").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    console.error("deleteJournalEntry: failed to delete journal entry", error);
    return { status: "error", message: "Couldn't remove that entry. Please try again." };
  }

  return { status: "success" };
}

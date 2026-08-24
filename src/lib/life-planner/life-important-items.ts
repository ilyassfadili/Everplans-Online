import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LIFE_IMPORTANT_ITEM_CATEGORIES, type LifeImportantItem, type LifeImportantItemCategory } from "@/types/life-planner";

import { getLifeGoalById } from "./life-goals";

/**
 * Important Plans & Information - `public.life_important_items`
 * (`supabase/migrations/20260920000000_life_planner_important_items.sql`),
 * Life Planner Prompt 4 Phase 3. Same shape as every other Life Planner DAL:
 * every exported function calls `requireUser()` itself, and RLS (a direct
 * `owner_id = auth.uid()` policy) independently enforces "only this user's
 * own items."
 *
 * This is private personal data - a plan, an intention, a milestone note, a
 * reference detail, or a plain note the user wants to keep close, never a
 * shared plan or checklist. RLS is the *only* access boundary this table
 * has (see the migration's own comment) - there is no service-role client
 * anywhere in this file, and there must never be one added here without a
 * deliberate, separate decision to do so, the same rigor
 * `@/lib/life-planner/life-journal` documents for Journal.
 *
 * `server-only`: reads/writes `public.life_important_items` through the
 * server Supabase client. Never safe to import from a Client Component.
 */

const IMPORTANT_ITEM_COLUMNS = "id, owner_id, title, content, category, life_area_id, goal_id, is_archived, created_at, updated_at";

type LifeImportantItemRow = {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  category: string;
  life_area_id: string | null;
  goal_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

/** Falls back to `"other"` for a category value this build doesn't recognize (e.g. a future category added at the database layer before this union catches up) - the same defensive "never let an unrecognized enum value crash the read" posture other mapped-string-union columns in this schema keep. */
function toImportantItemCategory(value: string): LifeImportantItemCategory {
  return (LIFE_IMPORTANT_ITEM_CATEGORIES as readonly string[]).includes(value) ? (value as LifeImportantItemCategory) : "other";
}

function mapLifeImportantItemRow(row: LifeImportantItemRow): LifeImportantItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    content: row.content,
    category: toImportantItemCategory(row.category),
    lifeAreaId: row.life_area_id,
    goalId: row.goal_id,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface GetImportantItemsOptions {
  /** Include archived items - `false` (the default) is every real view of the list; only the "view archived" toggle passes `true`. */
  includeArchived?: boolean;
  /** Narrow to one category. */
  category?: LifeImportantItemCategory;
  /** Narrow to items filed under one Life Area. */
  lifeAreaId?: string;
  /** Narrow to items linked to one Goal - the goal detail page's own "Important information" section. */
  goalId?: string;
}

/**
 * Every Important Item the current user has, newest first (`createdAt`
 * descending - unlike Journal, this table has no dated-entry concept to sort
 * by, see `LifeImportantItem`'s own comment on why). Excludes archived items
 * by default, the same "archive is this table's soft-delete, hidden from
 * every ordinary view" convention `getJournalEntriesForCurrentUser` already
 * establishes.
 */
export async function getImportantItemsForCurrentUser(opts: GetImportantItemsOptions = {}): Promise<LifeImportantItem[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("life_important_items").select(IMPORTANT_ITEM_COLUMNS).eq("owner_id", user.id);

  if (!opts.includeArchived) {
    query = query.eq("is_archived", false);
  }
  if (opts.category) {
    query = query.eq("category", opts.category);
  }
  if (opts.lifeAreaId) {
    query = query.eq("life_area_id", opts.lifeAreaId);
  }
  if (opts.goalId) {
    query = query.eq("goal_id", opts.goalId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("getImportantItemsForCurrentUser: failed to load important items", error);
    return [];
  }

  return (data ?? []).map(mapLifeImportantItemRow);
}

/**
 * One Important Item by id, owner-scoped - `null` both when no row with that
 * id exists at all and when it belongs to someone else (RLS already
 * prevents the latter from ever returning data, and the explicit
 * `owner_id` filter here is the same belt-and-suspenders confirmation
 * `getJournalEntryById` already applies one table over).
 */
export async function getImportantItemById(id: string): Promise<LifeImportantItem | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_important_items").select(IMPORTANT_ITEM_COLUMNS).eq("id", id).eq("owner_id", user.id).maybeSingle();

  if (error) {
    console.error("getImportantItemById: failed to load important item", error);
    return null;
  }

  return data ? mapLifeImportantItemRow(data) : null;
}

const RECENT_IMPORTANT_ITEMS_LIMIT = 3;

/**
 * Up to `limit` non-archived Important Items, newest first - the
 * dashboard's own compact preview section. A dedicated, narrowly limited
 * query rather than slicing `getImportantItemsForCurrentUser()`'s full
 * result, the same "purpose-built query for a dashboard preview" shape
 * `getRecentJournalEntriesForCurrentUser` already establishes.
 */
export async function getRecentImportantItemsForCurrentUser(limit = RECENT_IMPORTANT_ITEMS_LIMIT): Promise<LifeImportantItem[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_important_items")
    .select(IMPORTANT_ITEM_COLUMNS)
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentImportantItemsForCurrentUser: failed to load recent important items", error);
    return [];
  }

  return (data ?? []).map(mapLifeImportantItemRow);
}

const titleSchema = z.string().trim().min(1, "Give this a title.").max(140, "Keep it under 140 characters.");
const contentSchema = z.string().trim().min(1, "Write something before saving.").max(5000, "Keep it under 5,000 characters.");
const categorySchema = z.enum(LIFE_IMPORTANT_ITEM_CATEGORIES).default("note");

// A Life Area/Goal select renders its "none" choice as an empty string
// (Radix `Select.Item` can't take a genuinely empty `value`), so this
// normalizes both "field omitted" and the empty-string sentinel to `null`
// before the real `uuid()` check runs - the same "" -> null normalization
// `life-journal.ts`'s own `optionalUuidSchema` already uses.
const optionalUuidSchema = z
  .union([z.string().trim().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

/**
 * Verifies `lifeAreaId` belongs to the current user before letting an item
 * reference it - `life_areas`' own insert/update policies only check the
 * *item's* `owner_id`, not that a caller-supplied `life_area_id` actually
 * belongs to that same owner, so an unverified id would let a signed-in
 * user file an item under any area id they can guess. Same reasoning
 * `verifyLifeAreaOwnership` (`@/lib/life-planner/life-journal`) documents
 * for its own caller-supplied `lifeAreaId`.
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
 * Verifies `goalId` belongs to the current user before letting an item
 * reference it - reuses `getLifeGoalById`, which is already owner-scoped (a
 * `null` result covers both "doesn't exist" and "belongs to someone else"),
 * the exact same guard `verifyGoalOwnership` (`@/lib/life-planner/life-journal`)
 * already applies for the same reason.
 */
async function verifyGoalOwnership(goalId: string): Promise<boolean> {
  const goal = await getLifeGoalById(goalId);
  return goal !== null;
}

const createImportantItemSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  category: categorySchema,
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
});

export type CreateImportantItemInput = z.input<typeof createImportantItemSchema>;

export type LifeImportantItemMutationResult =
  | { status: "success"; item: LifeImportantItem }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates a new Important Item for the current user - the composer's own
 * "Save" action. Cross-user isolation for `lifeAreaId`/`goalId`: both are
 * verified against the current user before the insert proceeds, the same
 * guard `createJournalEntry` (`@/lib/life-planner/life-journal`) already
 * applies for the same two optional filing references.
 */
export async function createImportantItem(input: CreateImportantItemInput): Promise<LifeImportantItemMutationResult> {
  const user = await requireUser();

  const parsed = createImportantItemSchema.safeParse(input);
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
    .from("life_important_items")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category,
      life_area_id: parsed.data.lifeAreaId,
      goal_id: parsed.data.goalId,
    })
    .select(IMPORTANT_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createImportantItem: failed to create important item", error);
    return { status: "error", message: "Couldn't save that item. Please try again." };
  }

  return { status: "success", item: mapLifeImportantItemRow(data) };
}

const updateImportantItemSchema = z.object({
  title: titleSchema.optional(),
  content: contentSchema.optional(),
  category: categorySchema.optional(),
  lifeAreaId: optionalUuidSchema,
  goalId: optionalUuidSchema,
});

export type UpdateImportantItemInput = z.input<typeof updateImportantItemSchema>;

/**
 * Edits an Important Item in place - a partial patch (only the fields
 * actually present in `input` are written), the same "check presence on
 * the raw input, not the parsed output" shape `updateJournalEntry` uses.
 */
export async function updateImportantItem(id: string, input: UpdateImportantItemInput): Promise<LifeImportantItemMutationResult> {
  const user = await requireUser();

  const parsed = updateImportantItemSchema.safeParse(input);
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
    category?: LifeImportantItemCategory;
    life_area_id?: string | null;
    goal_id?: string | null;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.content !== undefined) patch.content = parsed.data.content;
  if (parsed.data.category !== undefined) patch.category = parsed.data.category;
  if (Object.hasOwn(input, "lifeAreaId")) patch.life_area_id = parsed.data.lifeAreaId;
  if (Object.hasOwn(input, "goalId")) patch.goal_id = parsed.data.goalId;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_important_items").update(patch).eq("id", id).eq("owner_id", user.id).select(IMPORTANT_ITEM_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateImportantItem: failed to update important item", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", item: mapLifeImportantItemRow(data) };
}

/**
 * Archives an Important Item - sets `isArchived: true`, leaving the row (and
 * its content) in place. This table's primary "remove from view" affordance,
 * the same role `archiveJournalEntry` plays for `life_journal_entries` - see
 * `deleteImportantItem` below for the plain hard delete this deliberately
 * isn't.
 */
export async function archiveImportantItem(id: string): Promise<LifeImportantItemMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_important_items")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(IMPORTANT_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("archiveImportantItem: failed to archive important item", error);
    return { status: "error", message: "Couldn't archive that item. Please try again." };
  }

  return { status: "success", item: mapLifeImportantItemRow(data) };
}

/** Un-archives an Important Item - the inverse of `archiveImportantItem`, offered wherever an archived item appears. */
export async function unarchiveImportantItem(id: string): Promise<LifeImportantItemMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_important_items")
    .update({ is_archived: false })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(IMPORTANT_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("unarchiveImportantItem: failed to unarchive important item", error);
    return { status: "error", message: "Couldn't restore that item. Please try again." };
  }

  return { status: "success", item: mapLifeImportantItemRow(data) };
}

export type DeleteImportantItemResult = { status: "success" } | { status: "error"; message: string };

/**
 * Deletes an Important Item outright - kept for parity with every other Life
 * Planner DAL, and offered as a genuine "permanently remove" affordance
 * alongside `archiveImportantItem`, the same "archive is primary, delete is
 * still real" shape `deleteJournalEntry` documents one table over. No "keep
 * at least one" floor - a user is free to end up with zero items.
 */
export async function deleteImportantItem(id: string): Promise<DeleteImportantItemResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("life_important_items").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    console.error("deleteImportantItem: failed to delete important item", error);
    return { status: "error", message: "Couldn't remove that item. Please try again." };
  }

  return { status: "success" };
}

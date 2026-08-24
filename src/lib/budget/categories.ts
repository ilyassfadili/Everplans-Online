import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { parseAmountToCents } from "@/lib/budget/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetCategory, BudgetCategoryGroup, BudgetCategoryKind } from "@/types/budget";

/**
 * Budget Planner expense categories - `public.budget_categories`. Same
 * shape as `@/lib/wedding/budget-categories`: every function calls
 * `requireUser()` itself, and RLS (a join back to `budget_plans.owner_id`)
 * independently enforces the same "only this plan's owner" boundary.
 */

const CATEGORY_COLUMNS = "id, plan_id, name, group_label, kind, planned_amount_cents, is_archived, sort_order, notes, created_at, updated_at";

type CategoryRow = {
  id: string;
  plan_id: string;
  name: string;
  group_label: string;
  kind: string;
  planned_amount_cents: number;
  is_archived: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapCategoryRow(row: CategoryRow): BudgetCategory {
  return {
    id: row.id,
    planId: row.plan_id,
    name: row.name,
    // Cast, not re-validated: `budget_categories_group_label_valid`/
    // `budget_categories_kind_valid` (the migration) already guarantee the
    // database can never hold anything outside these unions - same
    // convention `@/lib/wedding/tasks` uses for its own status/priority
    // columns.
    group: row.group_label as BudgetCategoryGroup,
    kind: row.kind as BudgetCategoryKind,
    plannedAmountCents: row.planned_amount_cents,
    isArchived: row.is_archived,
    sortOrder: row.sort_order,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Active (non-archived) categories, in display order - the set every
 * planning view (Budget, Expenses, the dashboard) reads by default.
 * `kind` narrows to just income or expense categories (every existing
 * caller passes `"expense"`, preserving exactly what it showed before
 * `kind` existed); omit it only for a view that genuinely wants both, like
 * the dedicated Categories page.
 */
export async function getCategoriesForPlan(planId: string, kind?: BudgetCategoryKind): Promise<BudgetCategory[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("budget_categories").select(CATEGORY_COLUMNS).eq("plan_id", planId).eq("is_archived", false);
  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query.order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategoriesForPlan: failed to load categories", error);
    return [];
  }

  return (data ?? []).map(mapCategoryRow);
}

/**
 * Every category regardless of archived state (Prompt 5 Phase 1) - the set
 * anything *displaying* an already-assigned category (an expense's badge,
 * a recurring item's row) must read from instead of `getCategoriesForPlan`,
 * so an archived category's name keeps resolving correctly wherever it's
 * still referenced. Never used to populate a category *picker* - archived
 * categories intentionally can't be newly assigned. Same optional `kind`
 * narrowing as `getCategoriesForPlan`.
 */
export async function getAllCategoriesForPlan(planId: string, kind?: BudgetCategoryKind): Promise<BudgetCategory[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("budget_categories").select(CATEGORY_COLUMNS).eq("plan_id", planId);
  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query.order("sort_order", { ascending: true });

  if (error) {
    console.error("getAllCategoriesForPlan: failed to load categories", error);
    return [];
  }

  return (data ?? []).map(mapCategoryRow);
}

/** Archived categories only - the Budget/Categories pages' own "Archived" section, so a category can be found and restored again. */
export async function getArchivedCategoriesForPlan(planId: string, kind?: BudgetCategoryKind): Promise<BudgetCategory[]> {
  const all = await getAllCategoriesForPlan(planId, kind);
  return all.filter((category) => category.isArchived);
}

const amountCentsSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? parseAmountToCents(value) : 0))
  .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative."));

const groupSchema = z.enum(["essentials", "lifestyle", "savings", "goals", "other"]);

const kindSchema = z.enum(["income", "expense"]);

const notesSchema = z
  .string()
  .trim()
  .max(500, "Keep notes under 500 characters.")
  .optional()
  .transform((value) => (value ? value : null));

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Give this category a name.").max(100, "Keep it under 100 characters."),
  // Expense categories have a planned amount to budget against; income
  // categories don't (there's no "planned" side to categorizing where money
  // came from) - defaulting to `0` for an income category keeps the column
  // meaningless-but-harmless rather than adding a nullable variant.
  plannedAmountCents: amountCentsSchema,
  group: groupSchema.optional().default("other"),
  kind: kindSchema.optional().default("expense"),
  notes: notesSchema,
});

export type CreateBudgetCategoryInput = z.input<typeof createCategorySchema>;

export type BudgetCategoryMutationResult =
  | { status: "success"; category: BudgetCategory }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createCategory(planId: string, input: CreateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
  await requireUser();

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("budget_categories")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  const { data, error } = await supabase
    .from("budget_categories")
    .insert({
      plan_id: planId,
      name: parsed.data.name,
      planned_amount_cents: parsed.data.plannedAmountCents,
      group_label: parsed.data.group,
      kind: parsed.data.kind,
      sort_order: count ?? 0,
      notes: parsed.data.notes,
    })
    .select(CATEGORY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createCategory: failed to create category", error);
    return { status: "error", message: "Couldn't add that category. Please try again." };
  }

  return { status: "success", category: mapCategoryRow(data) };
}

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Give this category a name.").max(100, "Keep it under 100 characters.").optional(),
  plannedAmountCents: amountCentsSchema.optional(),
  group: groupSchema.optional(),
  notes: notesSchema,
});

export type UpdateBudgetCategoryInput = z.input<typeof updateCategorySchema>;

export async function updateCategory(categoryId: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
  await requireUser();

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; planned_amount_cents?: number; group_label?: BudgetCategoryGroup; notes?: string | null } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  // `plannedAmountCents` defaults its transform to `0` when absent (so
  // `createCategory` can always insert a real number), which means
  // checking `!== undefined` on the parsed output can't tell "omitted" from
  // "explicitly zeroed" - checking presence on the raw `input` is what
  // makes editing just a category's name never silently reset its planned
  // amount, the same fix `updateBudgetCategory` (Wedding) applies.
  if (Object.hasOwn(input, "plannedAmountCents")) patch.planned_amount_cents = parsed.data.plannedAmountCents;
  if (parsed.data.group !== undefined) patch.group_label = parsed.data.group;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_categories")
    .update(patch)
    .eq("id", categoryId)
    .select(CATEGORY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateCategory: failed to update category", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", category: mapCategoryRow(data) };
}

export type DeleteBudgetCategoryResult = { status: "success" } | { status: "error"; message: string };

/**
 * Archives a category rather than deleting it (Prompt 5 Phase 1's own
 * "never silently delete related financial information" requirement) -
 * expenses and recurring items that reference it keep working, they simply
 * stop seeing it in active category pickers (`getCategoriesForPlan` only
 * returns non-archived rows).
 */
export async function archiveCategory(categoryId: string): Promise<DeleteBudgetCategoryResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_categories").update({ is_archived: true }).eq("id", categoryId);

  if (error) {
    console.error("archiveCategory: failed to archive category", error);
    return { status: "error", message: "Couldn't remove that category. Please try again." };
  }

  return { status: "success" };
}

/** Brings an archived category back into active planning views - the undo side of `archiveCategory`. */
export async function restoreCategory(categoryId: string): Promise<DeleteBudgetCategoryResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_categories").update({ is_archived: false }).eq("id", categoryId);

  if (error) {
    console.error("restoreCategory: failed to restore category", error);
    return { status: "error", message: "Couldn't restore that category. Please try again." };
  }

  return { status: "success" };
}

/**
 * Swaps one category's `sort_order` with its neighbor in the same group
 * (Prompt 5 Phase 1's own "reorder categories where useful") - a plain up/
 * down move rather than full drag-and-drop, so reordering needs no new
 * dependency. `direction: "up"` moves toward the start of the list.
 */
export async function moveCategory(
  planId: string,
  categoryId: string,
  direction: "up" | "down",
): Promise<DeleteBudgetCategoryResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: categories, error: loadError } = await supabase
    .from("budget_categories")
    .select("id, group_label, sort_order")
    .eq("plan_id", planId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (loadError || !categories) {
    console.error("moveCategory: failed to load categories", loadError);
    return { status: "error", message: "Couldn't reorder that category. Please try again." };
  }

  const current = categories.find((category) => category.id === categoryId);
  if (!current) {
    return { status: "error", message: "That category no longer exists." };
  }

  // Reordering only makes sense within a category's own group - moving
  // "up" across group boundaries would silently change which priority
  // group a category belongs to, which is `updateCategory`'s job, not
  // this one's.
  const groupCategories = categories.filter((category) => category.group_label === current.group_label);
  const currentIndex = groupCategories.findIndex((category) => category.id === categoryId);
  const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const neighbor = groupCategories[neighborIndex];

  if (!neighbor) {
    // Already at the edge of its group - not an error, just nothing to do.
    return { status: "success" };
  }

  const [firstUpdate, secondUpdate] = await Promise.all([
    supabase.from("budget_categories").update({ sort_order: neighbor.sort_order }).eq("id", current.id),
    supabase.from("budget_categories").update({ sort_order: current.sort_order }).eq("id", neighbor.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    console.error("moveCategory: failed to swap sort order", firstUpdate.error ?? secondUpdate.error);
    return { status: "error", message: "Couldn't reorder that category. Please try again." };
  }

  return { status: "success" };
}

const reallocateSchema = z.object({
  fromCategoryId: z.string().trim().min(1, "Choose a category to move money from."),
  toCategoryId: z.string().trim().min(1, "Choose a category to move money to."),
  amountCents: z
    .string()
    .trim()
    .transform((value) => parseAmountToCents(value))
    .pipe(z.number({ error: "Enter a valid amount." }).int().min(1, "Enter an amount greater than zero.")),
});

export type ReallocateInput = z.input<typeof reallocateSchema>;

export type ReallocateResult = { status: "success" } | { status: "invalid"; message: string } | { status: "error"; message: string };

/**
 * Moves planned budget from one category to another (Prompt 5 Phase 4) -
 * the total planned across both categories is unchanged before and after,
 * the same "clearly communicate the budget remains balanced... never
 * create money that doesn't exist" requirement. Refuses to move more than
 * the source category currently has planned, rather than letting it go
 * negative - `budget_categories_planned_amount_non_negative` would reject
 * that at the database layer anyway, but this returns a clear, specific
 * message instead of a raw constraint-violation error.
 */
export async function reallocateBetweenCategories(input: ReallocateInput): Promise<ReallocateResult> {
  await requireUser();

  const parsed = reallocateSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (parsed.data.fromCategoryId === parsed.data.toCategoryId) {
    return { status: "invalid", message: "Choose two different categories." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: categories, error: loadError } = await supabase
    .from("budget_categories")
    .select("id, planned_amount_cents")
    .in("id", [parsed.data.fromCategoryId, parsed.data.toCategoryId]);

  if (loadError || !categories || categories.length !== 2) {
    console.error("reallocateBetweenCategories: failed to load categories", loadError);
    return { status: "error", message: "Couldn't find those categories. Please try again." };
  }

  const fromCategory = categories.find((category) => category.id === parsed.data.fromCategoryId)!;
  const toCategory = categories.find((category) => category.id === parsed.data.toCategoryId)!;

  if (parsed.data.amountCents > fromCategory.planned_amount_cents) {
    return { status: "invalid", message: "That category doesn't have that much planned to move." };
  }

  const [fromUpdate, toUpdate] = await Promise.all([
    supabase
      .from("budget_categories")
      .update({ planned_amount_cents: fromCategory.planned_amount_cents - parsed.data.amountCents })
      .eq("id", fromCategory.id),
    supabase
      .from("budget_categories")
      .update({ planned_amount_cents: toCategory.planned_amount_cents + parsed.data.amountCents })
      .eq("id", toCategory.id),
  ]);

  if (fromUpdate.error || toUpdate.error) {
    console.error("reallocateBetweenCategories: failed to move funds", fromUpdate.error ?? toUpdate.error);
    return { status: "error", message: "Couldn't move that amount. Please try again." };
  }

  return { status: "success" };
}

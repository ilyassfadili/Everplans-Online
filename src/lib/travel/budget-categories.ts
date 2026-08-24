import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TripBudgetCategory } from "@/types/travel";

import { parseAmountToCents } from "./currency";

/**
 * Travel Planner budget categories - `public.trip_budget_categories` (see
 * `supabase/migrations/20260910000000_travel_planner_budget.sql`). Same
 * shape as `@/lib/wedding/budget-categories`: every function calls
 * `requireUser()` itself, and RLS (a join back to `trips.owner_id`)
 * independently enforces "only this trip's owner." Kept in its own
 * `server-only` module, separate from `./budget`'s pure derivations - the
 * same split Wedding Planner uses, and necessary here for a real reason:
 * `server-only` poisons the whole module it's imported into, so a Client
 * Component importing even a pure function from a module that also does
 * database access would fail the build.
 */

const CATEGORY_COLUMNS = "id, trip_id, name, planned_amount_cents, sort_order, created_at, updated_at";

type CategoryRow = {
  id: string;
  trip_id: string;
  name: string;
  planned_amount_cents: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapCategoryRow(row: CategoryRow): TripBudgetCategory {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    plannedAmountCents: row.planned_amount_cents,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBudgetCategoriesForTrip(tripId: string): Promise<TripBudgetCategory[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_budget_categories")
    .select(CATEGORY_COLUMNS)
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getBudgetCategoriesForTrip: failed to load categories", error);
    return [];
  }

  return (data ?? []).map(mapCategoryRow);
}

// The form sends a plain decimal dollar amount ("450.00") - converted to
// integer cents here, once, at the validation boundary, the same
// `parseAmountToCents` every monetary form field in this codebase uses.
const amountCentsSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? parseAmountToCents(value) : 0))
  .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative."));

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Give this category a name.").max(100, "Keep it under 100 characters."),
  plannedAmountCents: amountCentsSchema,
});

export type CreateBudgetCategoryInput = z.input<typeof createCategorySchema>;

export type BudgetCategoryMutationResult =
  | { status: "success"; category: TripBudgetCategory }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createBudgetCategory(tripId: string, input: CreateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
  await requireUser();

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("trip_budget_categories")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  const { data, error } = await supabase
    .from("trip_budget_categories")
    .insert({
      trip_id: tripId,
      name: parsed.data.name,
      planned_amount_cents: parsed.data.plannedAmountCents,
      sort_order: count ?? 0,
    })
    .select(CATEGORY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createBudgetCategory: failed to create category", error);
    return { status: "error", message: "Couldn't add that category. Please try again." };
  }

  return { status: "success", category: mapCategoryRow(data) };
}

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Give this category a name.").max(100, "Keep it under 100 characters.").optional(),
  plannedAmountCents: amountCentsSchema.optional(),
});

export type UpdateBudgetCategoryInput = z.input<typeof updateCategorySchema>;

export async function updateBudgetCategory(categoryId: string, input: UpdateBudgetCategoryInput): Promise<BudgetCategoryMutationResult> {
  await requireUser();

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; planned_amount_cents?: number } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  // `plannedAmountCents` defaults its transform to `0` when absent (so
  // `createBudgetCategory` can always insert a real number) - checking
  // presence on the raw `input` (not the parsed output) is what makes
  // editing just a category's name never silently reset its planned
  // amount, the same fix `updateBudgetCategory` (Wedding Planner) applies.
  if (Object.hasOwn(input, "plannedAmountCents")) patch.planned_amount_cents = parsed.data.plannedAmountCents;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_budget_categories")
    .update(patch)
    .eq("id", categoryId)
    .select(CATEGORY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateBudgetCategory: failed to update category", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", category: mapCategoryRow(data) };
}

export type DeleteBudgetCategoryResult = { status: "success" } | { status: "error"; message: string };

/**
 * Deletes a category. Any expenses that referenced it are NOT deleted -
 * `trip_expenses.category_id` is `on delete set null` (Phase 2's own
 * migration), so they simply become uncategorized rather than
 * disappearing along with the category that used to group them.
 */
export async function deleteBudgetCategory(categoryId: string): Promise<DeleteBudgetCategoryResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("trip_budget_categories").delete().eq("id", categoryId);

  if (error) {
    console.error("deleteBudgetCategory: failed to delete category", error);
    return { status: "error", message: "Couldn't remove that category. Please try again." };
  }

  return { status: "success" };
}

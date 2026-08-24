import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAmountToCents } from "@/lib/wedding/currency";
import type { WeddingBudgetCategory } from "@/types/wedding";

/**
 * Wedding Planner budget categories - `public.wedding_budget_categories`
 * (`supabase/migrations/20260826000000_wedding_budget.sql`). Same shape as
 * `@/lib/wedding/milestones`: every function calls `requireUser()` itself,
 * and RLS (a join back to `weddings.owner_id`) independently enforces the
 * same "only this wedding's owner" boundary.
 */

const CATEGORY_COLUMNS = "id, wedding_id, name, description, planned_amount_cents, sort_order, created_at, updated_at";

type CategoryRow = {
  id: string;
  wedding_id: string;
  name: string;
  description: string | null;
  planned_amount_cents: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapCategoryRow(row: CategoryRow): WeddingBudgetCategory {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    name: row.name,
    description: row.description,
    plannedAmountCents: row.planned_amount_cents,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBudgetCategoriesForWedding(weddingId: string): Promise<WeddingBudgetCategory[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_budget_categories")
    .select(CATEGORY_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getBudgetCategoriesForWedding: failed to load categories", error);
    return [];
  }

  return (data ?? []).map(mapCategoryRow);
}

// The form sends a plain decimal dollar amount ("1250.50") - converted to
// integer cents here, once, at the validation boundary, via the same
// `parseAmountToCents` every monetary form field in this feature uses -
// never a second, slightly different parsing rule per field.
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
  | { status: "success"; category: WeddingBudgetCategory }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createBudgetCategory(
  weddingId: string,
  input: CreateBudgetCategoryInput,
): Promise<BudgetCategoryMutationResult> {
  await requireUser();

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("wedding_budget_categories")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", weddingId);

  const { data, error } = await supabase
    .from("wedding_budget_categories")
    .insert({
      wedding_id: weddingId,
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

export async function updateBudgetCategory(
  categoryId: string,
  input: UpdateBudgetCategoryInput,
): Promise<BudgetCategoryMutationResult> {
  await requireUser();

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; planned_amount_cents?: number } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  // `plannedAmountCents` defaults its transform to `0` when absent (so
  // `createBudgetCategory` can always insert a real number) - which means
  // checking `!== undefined` on the parsed output can't tell "omitted"
  // from "explicitly zeroed". Checking presence on the raw `input` is
  // what makes editing just a category's name never silently reset its
  // planned amount - see `updateTask`'s identical fix for the full
  // explanation of why the parsed value alone isn't enough here.
  if (Object.hasOwn(input, "plannedAmountCents")) patch.planned_amount_cents = parsed.data.plannedAmountCents;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_budget_categories")
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
 * `wedding_expenses.category_id` is `on delete set null` (the migration),
 * so they simply become uncategorized rather than disappearing along with
 * the category that used to group them.
 */
export async function deleteBudgetCategory(categoryId: string): Promise<DeleteBudgetCategoryResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_budget_categories").delete().eq("id", categoryId);

  if (error) {
    console.error("deleteBudgetCategory: failed to delete category", error);
    return { status: "error", message: "Couldn't remove that category. Please try again." };
  }

  return { status: "success" };
}

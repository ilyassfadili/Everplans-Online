import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PackingCategory, PackingItem } from "@/types/travel";

/**
 * Travel Planner packing checklist (Prompt 4 Phase 1) - `public.trip_packing_items`.
 * Same shape as `@/lib/travel/bookings`: every function calls `requireUser()`
 * itself, and RLS (a join back to `trips.owner_id`) independently enforces
 * "only this trip's owner."
 */

const PACKING_ITEM_COLUMNS = "id, trip_id, name, category, quantity, is_complete, notes, sort_order, created_at, updated_at";

const PACKING_CATEGORIES = [
  "clothing",
  "toiletries",
  "electronics",
  "travel-documents",
  "personal-essentials",
  "health",
  "other",
] as const satisfies readonly PackingCategory[];

type PackingItemRow = {
  id: string;
  trip_id: string;
  name: string;
  category: string;
  quantity: number;
  is_complete: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapPackingItemRow(row: PackingItemRow): PackingItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    category: row.category as PackingCategory,
    quantity: row.quantity,
    isComplete: row.is_complete,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPackingItemsForTrip(tripId: string): Promise<PackingItem[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_packing_items")
    .select(PACKING_ITEM_COLUMNS)
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getPackingItemsForTrip: failed to load packing items", error);
    return [];
  }

  return (data ?? []).map(mapPackingItemRow);
}

const packingItemSchema = z.object({
  name: z.string().trim().min(1, "Give this item a name.").max(150, "Keep it under 150 characters."),
  category: z.enum(PACKING_CATEGORIES, { message: "Choose a category." }),
  quantity: z.coerce.number().int("Whole numbers only.").min(1, "At least 1.").max(999, "Keep it to 999 or fewer."),
  notes: z
    .string()
    .trim()
    .max(500, "Keep it under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type PackingItemInput = z.input<typeof packingItemSchema>;

export type PackingItemMutationResult =
  | { status: "success"; item: PackingItem }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createPackingItem(tripId: string, input: PackingItemInput): Promise<PackingItemMutationResult> {
  await requireUser();

  const parsed = packingItemSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase.from("trip_packing_items").select("id", { count: "exact", head: true }).eq("trip_id", tripId);

  const { data, error } = await supabase
    .from("trip_packing_items")
    .insert({
      trip_id: tripId,
      name: parsed.data.name,
      category: parsed.data.category,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes,
      sort_order: count ?? 0,
    })
    .select(PACKING_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createPackingItem: failed to create packing item", error);
    return { status: "error", message: "Couldn't add that item. Please try again." };
  }

  return { status: "success", item: mapPackingItemRow(data) };
}

/** Edits a packing item's full details (name/category/quantity/notes) - see `setPackingItemComplete` for the separate, lighter-weight "just toggle the checkbox" mutation. */
export async function updatePackingItem(itemId: string, input: PackingItemInput): Promise<PackingItemMutationResult> {
  await requireUser();

  const parsed = packingItemSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_packing_items")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes,
    })
    .eq("id", itemId)
    .select(PACKING_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updatePackingItem: failed to update packing item", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", item: mapPackingItemRow(data) };
}

/**
 * Toggles just `is_complete` - the checkbox click's own mutation, kept
 * separate from `updatePackingItem` so checking an item off is a single,
 * fast round trip rather than resubmitting every field just to flip one
 * boolean (Phase 1's own "quick to use" UX requirement).
 */
export async function setPackingItemComplete(itemId: string, isComplete: boolean): Promise<PackingItemMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_packing_items")
    .update({ is_complete: isComplete })
    .eq("id", itemId)
    .select(PACKING_ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("setPackingItemComplete: failed to update packing item", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", item: mapPackingItemRow(data) };
}

export type DeletePackingItemResult = { status: "success" } | { status: "error"; message: string };

export async function deletePackingItem(itemId: string): Promise<DeletePackingItemResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("trip_packing_items").delete().eq("id", itemId);

  if (error) {
    console.error("deletePackingItem: failed to delete packing item", error);
    return { status: "error", message: "Couldn't remove that item. Please try again." };
  }

  return { status: "success" };
}

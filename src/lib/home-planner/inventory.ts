import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InventoryCategory, InventoryItem } from "@/types/home-planner";

/**
 * Home Planner inventory - `public.home_inventory_items`
 * (`supabase/migrations/20260910000003_home_inventory.sql`). Same shape as
 * `@/lib/home-planner/rooms`: every function calls `requireUser()` itself,
 * and RLS (a join back to `homes.owner_id`) independently enforces the
 * same "only this home's owner" boundary.
 */

const ITEM_COLUMNS =
  "id, home_id, room_id, name, category, quantity, purchase_date, purchase_info, estimated_value_cents, notes, is_important, created_at, updated_at";

const CATEGORIES = [
  "furniture",
  "electronics",
  "appliances",
  "kitchen",
  "tools",
  "clothing",
  "outdoor",
  "other",
] as const satisfies readonly InventoryCategory[];

type ItemRow = {
  id: string;
  home_id: string;
  room_id: string | null;
  name: string;
  category: string;
  quantity: number;
  purchase_date: string | null;
  purchase_info: string | null;
  estimated_value_cents: number | null;
  notes: string | null;
  is_important: boolean;
  created_at: string;
  updated_at: string;
};

function mapItemRow(row: ItemRow): InventoryItem {
  return {
    id: row.id,
    homeId: row.home_id,
    roomId: row.room_id,
    name: row.name,
    // Cast, not re-validated: `home_inventory_items_category_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    category: row.category as InventoryCategory,
    quantity: row.quantity,
    purchaseDate: row.purchase_date,
    purchaseInfo: row.purchase_info,
    estimatedValueCents: row.estimated_value_cents,
    notes: row.notes,
    isImportant: row.is_important,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * All inventory items for a home. Search and category/room filtering
 * happen client-side over this full list (`InventoryList`'s own comment) -
 * the same "fetch once, filter in the browser" pattern `GuestList`
 * (Wedding Planner) already establishes for its RSVP filter, appropriate
 * at the scale a home inventory actually reaches.
 */
export async function getInventoryForHome(homeId: string): Promise<InventoryItem[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_inventory_items")
    .select(ITEM_COLUMNS)
    .eq("home_id", homeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getInventoryForHome: failed to load inventory", error);
    return [];
  }

  return (data ?? []).map(mapItemRow);
}

/**
 * Important items only (Prompt 2 Phase 3) - the same table, filtered at
 * the query level to `is_important = true`, not a second table (this
 * file's own header comment). Whatever `updateInventoryItem`/`setItemImportant`
 * changes, this view can never drift out of sync with, since it is that
 * same underlying record.
 */
export async function getImportantItemsForHome(homeId: string): Promise<InventoryItem[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_inventory_items")
    .select(ITEM_COLUMNS)
    .eq("home_id", homeId)
    .eq("is_important", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getImportantItemsForHome: failed to load important items", error);
    return [];
  }

  return (data ?? []).map(mapItemRow);
}

/**
 * Marks or unmarks an item as important - a direct, instant-save toggle
 * (no form, no confirmation), the same "save automatically for simple
 * preferences" pattern `GuestRow`'s RSVP `Select` already establishes,
 * appropriate for a single boolean flag.
 */
export async function setItemImportant(itemId: string, isImportant: boolean): Promise<InventoryItemMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_inventory_items")
    .update({ is_important: isImportant })
    .eq("id", itemId)
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("setItemImportant: failed to update item", error);
    return { status: "error", message: "Couldn't update that item. Please try again." };
  }

  return { status: "success", item: mapItemRow(data) };
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const itemSchema = z.object({
  name: z.string().trim().min(1, "Enter an item name.").max(150, "Keep it under 150 characters."),
  category: z.enum(CATEGORIES, { message: "Choose a category." }),
  roomId: optionalIdSchema,
  quantity: z.coerce.number({ message: "Enter a quantity." }).int("Whole numbers only.").min(1, "At least 1.").max(10000, "Keep it to 10000 or fewer."),
  purchaseDate: optionalTextSchema(10, "Enter a valid date."),
  purchaseInfo: optionalTextSchema(500, "Keep it under 500 characters."),
  estimatedValueDollars: z
    .string()
    .trim()
    .max(20, "Keep it short.")
    .optional()
    .transform((value) => {
      if (!value) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
    }),
  notes: optionalTextSchema(2000, "Keep it under 2000 characters."),
});

export type InventoryItemInput = z.input<typeof itemSchema>;

export type InventoryItemMutationResult =
  | { status: "success"; item: InventoryItem }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Item creation (Phase 2: "do not overcomplicate the data model") - name, category, room, quantity, and optional purchase/value details. */
export async function createInventoryItem(homeId: string, input: InventoryItemInput): Promise<InventoryItemMutationResult> {
  await requireUser();

  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_inventory_items")
    .insert({
      home_id: homeId,
      room_id: parsed.data.roomId,
      name: parsed.data.name,
      category: parsed.data.category,
      quantity: parsed.data.quantity,
      purchase_date: parsed.data.purchaseDate,
      purchase_info: parsed.data.purchaseInfo,
      estimated_value_cents: parsed.data.estimatedValueDollars,
      notes: parsed.data.notes,
    })
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createInventoryItem: failed to create item", error);
    return { status: "error", message: "Couldn't add that item. Please try again." };
  }

  return { status: "success", item: mapItemRow(data) };
}

/** Edits an item - ships every field editable from day one, the same shape `updateRoom` follows. */
export async function updateInventoryItem(itemId: string, input: InventoryItemInput): Promise<InventoryItemMutationResult> {
  await requireUser();

  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_inventory_items")
    .update({
      room_id: parsed.data.roomId,
      name: parsed.data.name,
      category: parsed.data.category,
      quantity: parsed.data.quantity,
      purchase_date: parsed.data.purchaseDate,
      purchase_info: parsed.data.purchaseInfo,
      estimated_value_cents: parsed.data.estimatedValueDollars,
      notes: parsed.data.notes,
    })
    .eq("id", itemId)
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateInventoryItem: failed to update item", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", item: mapItemRow(data) };
}

export type DeleteInventoryItemResult = { status: "success" } | { status: "error"; message: string };

export async function deleteInventoryItem(itemId: string): Promise<DeleteInventoryItemResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("home_inventory_items").delete().eq("id", itemId);

  if (error) {
    console.error("deleteInventoryItem: failed to delete item", error);
    return { status: "error", message: "Couldn't remove that item. Please try again." };
  }

  return { status: "success" };
}

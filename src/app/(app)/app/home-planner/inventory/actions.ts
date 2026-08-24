"use server";

import { revalidatePath } from "next/cache";

import {
  createInventoryItem,
  deleteInventoryItem,
  setItemImportant,
  updateInventoryItem,
  type InventoryItemInput,
  type InventoryItemMutationResult,
} from "@/lib/home-planner/inventory";

/**
 * The inventory list's own Server Actions - thin wrappers around
 * `@/lib/home-planner/inventory`, colocated here since only this one route
 * mutates inventory items, the same shape `wedding-planner/guests/actions.ts`
 * establishes.
 */

const INVENTORY_PATH = "/app/home-planner/inventory";
const IMPORTANT_ITEMS_PATH = "/app/home-planner/important-items";
const HOME_PLANNER_PATH = "/app/home-planner";

function revalidateInventory() {
  revalidatePath(INVENTORY_PATH);
  revalidatePath(IMPORTANT_ITEMS_PATH);
  revalidatePath(HOME_PLANNER_PATH);
}

export interface CreateInventoryItemFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createInventoryItemFormAction(
  homeId: string,
  _prevState: CreateInventoryItemFormState,
  formData: FormData,
): Promise<CreateInventoryItemFormState> {
  const result = await createInventoryItem(homeId, formDataToInput(formData));

  if (result.status === "success") {
    revalidateInventory();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editInventoryItemAction(itemId: string, input: InventoryItemInput): Promise<InventoryItemMutationResult> {
  const result = await updateInventoryItem(itemId, input);
  if (result.status === "success") {
    revalidateInventory();
  }
  return result;
}

export async function removeInventoryItemAction(itemId: string): Promise<void> {
  await deleteInventoryItem(itemId);
  revalidateInventory();
}

/** Marks/unmarks an item as important - shared by the Inventory list and the Important Items view, since both render the same underlying record. */
export async function toggleItemImportantAction(itemId: string, isImportant: boolean): Promise<InventoryItemMutationResult> {
  const result = await setItemImportant(itemId, isImportant);
  if (result.status === "success") {
    revalidateInventory();
  }
  return result;
}

function formDataToInput(formData: FormData): InventoryItemInput {
  const name = formData.get("name");
  const category = formData.get("category");
  const roomId = formData.get("roomId");
  const quantity = formData.get("quantity");
  const purchaseDate = formData.get("purchaseDate");
  const purchaseInfo = formData.get("purchaseInfo");
  const estimatedValueDollars = formData.get("estimatedValueDollars");
  const notes = formData.get("notes");

  return {
    name: typeof name === "string" ? name : "",
    // Cast, not validated here - `createInventoryItem`/`updateInventoryItem`'s
    // zod schema (`z.enum`) is the real validation; an unrecognized value
    // fails there with a friendly "Choose a category" message rather than
    // silently defaulting.
    category: (typeof category === "string" ? category : "") as InventoryItemInput["category"],
    roomId: typeof roomId === "string" ? roomId : undefined,
    quantity: typeof quantity === "string" ? quantity : "1",
    purchaseDate: typeof purchaseDate === "string" ? purchaseDate : undefined,
    purchaseInfo: typeof purchaseInfo === "string" ? purchaseInfo : undefined,
    estimatedValueDollars: typeof estimatedValueDollars === "string" ? estimatedValueDollars : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  };
}

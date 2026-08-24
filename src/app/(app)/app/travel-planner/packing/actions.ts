"use server";

import { revalidatePath } from "next/cache";

import {
  createPackingItem,
  deletePackingItem,
  setPackingItemComplete,
  updatePackingItem,
  type DeletePackingItemResult,
  type PackingItemInput,
  type PackingItemMutationResult,
} from "@/lib/travel/packing";

/**
 * The Packing page's own Server Actions - thin wrappers around
 * `@/lib/travel/packing`, the same split every other mutation in this
 * codebase uses. Every successful mutation revalidates this page and the
 * dashboard, the same `revalidateBookings`-style pattern `bookings/actions.ts`
 * already establishes.
 */

const PACKING_PATH = "/app/travel-planner/packing";
const DASHBOARD_PATH = "/app/travel-planner";

function revalidatePacking() {
  revalidatePath(PACKING_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function createPackingItemAction(tripId: string, input: PackingItemInput): Promise<PackingItemMutationResult> {
  const result = await createPackingItem(tripId, input);
  if (result.status === "success") {
    revalidatePacking();
  }
  return result;
}

export async function updatePackingItemAction(itemId: string, input: PackingItemInput): Promise<PackingItemMutationResult> {
  const result = await updatePackingItem(itemId, input);
  if (result.status === "success") {
    revalidatePacking();
  }
  return result;
}

export async function togglePackingItemAction(itemId: string, isComplete: boolean): Promise<PackingItemMutationResult> {
  const result = await setPackingItemComplete(itemId, isComplete);
  if (result.status === "success") {
    revalidatePacking();
  }
  return result;
}

export async function deletePackingItemAction(itemId: string): Promise<DeletePackingItemResult> {
  const result = await deletePackingItem(itemId);
  if (result.status === "success") {
    revalidatePacking();
  }
  return result;
}

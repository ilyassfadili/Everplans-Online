"use server";

import { revalidatePath } from "next/cache";

import { createVendor, deleteVendor, updateVendor, type CreateVendorInput, type UpdateVendorInput, type VendorMutationResult } from "@/lib/wedding/vendors";

/**
 * The vendor list/detail pages' own Server Actions - thin wrappers around
 * `@/lib/wedding/vendors`. Colocated at the `vendors/` segment root (not
 * inside `[vendorId]/`) since both the list page and each detail page use
 * these same mutations.
 */

const VENDORS_PATH = "/app/wedding-planner/vendors";
const WEDDING_PLANNER_PATH = "/app/wedding-planner";
const BUDGET_PATH = "/app/wedding-planner/budget";

function revalidateVendors() {
  revalidatePath(VENDORS_PATH);
  revalidatePath(WEDDING_PLANNER_PATH);
  // A vendor's name change should show up anywhere an expense already
  // displays it (the budget page's own vendor badges), without a manual
  // refresh.
  revalidatePath(BUDGET_PATH);
}

export interface CreateVendorFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createVendorFormAction(
  weddingId: string,
  _prevState: CreateVendorFormState,
  formData: FormData,
): Promise<CreateVendorFormState> {
  const name = formData.get("name");
  const category = formData.get("category");

  const input: CreateVendorInput = {
    name: typeof name === "string" ? name : "",
    category: typeof category === "string" ? category : undefined,
  };

  const result = await createVendor(weddingId, input);

  if (result.status === "success") {
    revalidateVendors();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editVendorAction(vendorId: string, input: UpdateVendorInput): Promise<VendorMutationResult> {
  const result = await updateVendor(vendorId, input);
  if (result.status === "success") {
    revalidateVendors();
  }
  return result;
}

export async function removeVendorAction(vendorId: string): Promise<void> {
  await deleteVendor(vendorId);
  revalidateVendors();
}

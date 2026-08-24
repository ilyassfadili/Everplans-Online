"use server";

import { revalidatePath } from "next/cache";

import { createGuest, deleteGuest, updateGuest, type GuestMutationResult, type UpdateGuestInput } from "@/lib/wedding/guests";

/**
 * The guest list's own Server Actions - thin wrappers around
 * `@/lib/wedding/guests`, colocated here since only this one route
 * mutates guests (the dashboard's own guest summary, `_components/guest-summary.tsx`,
 * is read-only).
 */

const GUESTS_PATH = "/app/wedding-planner/guests";
const WEDDING_PLANNER_PATH = "/app/wedding-planner";

function revalidateGuests() {
  revalidatePath(GUESTS_PATH);
  revalidatePath(WEDDING_PLANNER_PATH);
}

export interface CreateGuestFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createGuestFormAction(
  weddingId: string,
  _prevState: CreateGuestFormState,
  formData: FormData,
): Promise<CreateGuestFormState> {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const groupLabel = formData.get("groupLabel");

  const result = await createGuest(weddingId, {
    firstName: typeof firstName === "string" ? firstName : "",
    lastName: typeof lastName === "string" ? lastName : "",
    groupLabel: typeof groupLabel === "string" ? groupLabel : undefined,
  });

  if (result.status === "success") {
    revalidateGuests();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editGuestAction(guestId: string, input: UpdateGuestInput): Promise<GuestMutationResult> {
  const result = await updateGuest(guestId, input);
  if (result.status === "success") {
    revalidateGuests();
  }
  return result;
}

export async function removeGuestAction(guestId: string): Promise<void> {
  await deleteGuest(guestId);
  revalidateGuests();
}

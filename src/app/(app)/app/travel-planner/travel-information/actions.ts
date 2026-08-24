"use server";

import { revalidatePath } from "next/cache";

import {
  createEmergencyContact,
  deleteEmergencyContact,
  updateEmergencyContact,
  type DeleteEmergencyContactResult,
  type EmergencyContactInput,
  type EmergencyContactMutationResult,
} from "@/lib/travel/emergency-contacts";

/**
 * The Travel Information page's own Server Actions - thin wrappers around
 * `@/lib/travel/emergency-contacts`, the only genuinely new mutation
 * surface this page introduces (accommodation/transportation read from
 * Prompt 3's bookings, notes read from the trip itself - neither has its
 * own mutation here, see `page.tsx`'s own comment).
 */

const TRAVEL_INFO_PATH = "/app/travel-planner/travel-information";
const DASHBOARD_PATH = "/app/travel-planner";

function revalidateTravelInfo() {
  revalidatePath(TRAVEL_INFO_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function createEmergencyContactAction(tripId: string, input: EmergencyContactInput): Promise<EmergencyContactMutationResult> {
  const result = await createEmergencyContact(tripId, input);
  if (result.status === "success") {
    revalidateTravelInfo();
  }
  return result;
}

export async function updateEmergencyContactAction(contactId: string, input: EmergencyContactInput): Promise<EmergencyContactMutationResult> {
  const result = await updateEmergencyContact(contactId, input);
  if (result.status === "success") {
    revalidateTravelInfo();
  }
  return result;
}

export async function deleteEmergencyContactAction(contactId: string): Promise<DeleteEmergencyContactResult> {
  const result = await deleteEmergencyContact(contactId);
  if (result.status === "success") {
    revalidateTravelInfo();
  }
  return result;
}

"use server";

import { revalidatePath } from "next/cache";

import {
  createHouseholdMember,
  deleteHouseholdMember,
  updateHouseholdMember,
  type HouseholdMemberMutationResult,
  type UpdateHouseholdMemberInput,
} from "@/lib/home-planner/household-members";
import type { HouseholdRelationship } from "@/types/home-planner";

/**
 * The household list's own Server Actions - thin wrappers around
 * `@/lib/home-planner/household-members`, colocated here since only this
 * one route mutates household members, the same shape
 * `wedding-planner/guests/actions.ts` establishes.
 */

const HOUSEHOLD_PATH = "/app/home-planner/household";
const HOME_PLANNER_PATH = "/app/home-planner";

function revalidateHousehold() {
  revalidatePath(HOUSEHOLD_PATH);
  revalidatePath(HOME_PLANNER_PATH);
}

export interface CreateHouseholdMemberFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createHouseholdMemberFormAction(
  homeId: string,
  _prevState: CreateHouseholdMemberFormState,
  formData: FormData,
): Promise<CreateHouseholdMemberFormState> {
  const name = formData.get("name");
  const relationship = formData.get("relationship");

  const result = await createHouseholdMember(homeId, {
    name: typeof name === "string" ? name : "",
    // Cast, not validated here - `createHouseholdMember`'s zod schema
    // (`z.enum`) is the real validation; an unrecognized value fails there
    // with a friendly "Choose a relationship" message rather than silently
    // defaulting.
    relationship: (typeof relationship === "string" ? relationship : "") as HouseholdRelationship,
  });

  if (result.status === "success") {
    revalidateHousehold();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editHouseholdMemberAction(
  memberId: string,
  input: UpdateHouseholdMemberInput,
): Promise<HouseholdMemberMutationResult> {
  const result = await updateHouseholdMember(memberId, input);
  if (result.status === "success") {
    revalidateHousehold();
  }
  return result;
}

export async function removeHouseholdMemberAction(memberId: string): Promise<void> {
  await deleteHouseholdMember(memberId);
  revalidateHousehold();
}

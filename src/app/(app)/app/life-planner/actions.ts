"use server";

import { revalidatePath } from "next/cache";

import { updateLifePlan } from "@/lib/life-planner/life-plans";
import type { LifePlan } from "@/types/life-planner";

/**
 * The Life Profile form's Server Action - a thin wrapper around
 * `updateLifePlan` (`@/lib/life-planner/life-plans`), the same
 * "adapt `FormData` into the DAL's real input shape" role
 * `updateTripFormAction` (`@/app/(app)/app/travel-planner/edit/actions.ts`)
 * plays for Trip Setup. Reports a "success" state with the freshly-saved
 * plan instead of redirecting - there's nowhere more useful to send someone
 * who just edited their own Life Profile, and `LifeProfileSection`
 * (`@/components/life-planner/life-profile-form.tsx`) uses the returned
 * `plan` to flip itself back to view mode without waiting on a full page
 * refresh.
 *
 * `revalidatePath` still runs so a hard refresh, or any other route that
 * reads `getLifePlanForCurrentUser()`, never sees stale data.
 */

export interface UpdateLifeProfileFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
  plan?: LifePlan;
}

export async function updateLifeProfile(
  _prevState: UpdateLifeProfileFormState,
  formData: FormData,
): Promise<UpdateLifeProfileFormState> {
  const planningIdentity = formData.get("planningIdentity");
  const currentPriorities = formData.get("currentPriorities");
  const importantAreas = formData.get("importantAreas");
  const shortTermDirection = formData.get("shortTermDirection");
  const longTermDirection = formData.get("longTermDirection");
  const planningPreferences = formData.get("planningPreferences");

  const result = await updateLifePlan({
    planningIdentity: typeof planningIdentity === "string" ? planningIdentity : undefined,
    currentPriorities: typeof currentPriorities === "string" ? currentPriorities : undefined,
    importantAreas: typeof importantAreas === "string" ? importantAreas : undefined,
    shortTermDirection: typeof shortTermDirection === "string" ? shortTermDirection : undefined,
    longTermDirection: typeof longTermDirection === "string" ? longTermDirection : undefined,
    planningPreferences: typeof planningPreferences === "string" ? planningPreferences : undefined,
  });

  revalidatePath("/app/life-planner");

  if (result.status === "success") {
    return { status: "success", message: "Saved.", plan: result.plan };
  }
  return { status: result.status, message: result.message };
}

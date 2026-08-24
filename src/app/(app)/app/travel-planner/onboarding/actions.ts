"use server";

import { redirect } from "next/navigation";

import { TRAVEL_PLANNER_PRODUCT } from "@/config/products/travel-planner";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";
import { createTrip } from "@/lib/travel/trips";
import type { TripType } from "@/types/travel";

/**
 * The trip setup form's Server Action - a thin wrapper around `createTrip`
 * (`@/lib/travel/trips`), the same split every other mutation in this
 * codebase follows (see `wedding-planner/onboarding/actions.ts`'s own
 * comment). On success, redirects straight into the dashboard rather than
 * returning a "success" state for the form to render - there's nothing
 * left to show on the trip setup screen once the workspace exists.
 */

export interface CreateTripFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createTripFormAction(
  _prevState: CreateTripFormState,
  formData: FormData,
): Promise<CreateTripFormState> {
  // Everplans' real paywall enforcement (Prompt 6 Phase 1/2), not just the
  // onboarding page's own redirect (`./page.tsx`'s doc comment) - never
  // trust that a client reached this action only through the UI path that
  // already checked entitlement first, the same re-check
  // `completeBudgetOnboardingAction` (Budget Planner) already establishes.
  const user = await requireUser();
  if (!(await hasProductAccess(user.id, TRAVEL_PLANNER_PRODUCT.plannerId))) {
    return { status: "error", message: "Purchase Travel Planner to set up your trip." };
  }

  const destination = formData.get("destination");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const travelerCount = formData.get("travelerCount");
  const tripType = formData.get("tripType");
  const tripGoals = formData.get("tripGoals");
  const notes = formData.get("notes");

  const result = await createTrip({
    destination: typeof destination === "string" ? destination : "",
    startDate: typeof startDate === "string" ? startDate : "",
    endDate: typeof endDate === "string" ? endDate : "",
    travelerCount: typeof travelerCount === "string" ? travelerCount : "",
    // Cast, not validated here - `createTrip`'s zod schema (`z.enum`) is the
    // real validation; an unrecognized value fails there with a friendly
    // "Choose a trip type" message rather than silently defaulting.
    tripType: (typeof tripType === "string" ? tripType : "") as TripType,
    tripGoals: typeof tripGoals === "string" ? tripGoals : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  if (result.status === "success") {
    redirect("/app/travel-planner");
  }

  return { status: result.status, message: result.message };
}

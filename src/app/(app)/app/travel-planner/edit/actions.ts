"use server";

import { updateTrip } from "@/lib/travel/trips";
import type { TripType } from "@/types/travel";

/**
 * The edit trip form's Server Action - a thin wrapper around `updateTrip`
 * (`@/lib/travel/trips`). Unlike onboarding's `createTripFormAction`, this
 * stays on the page and reports a "success" state instead of redirecting -
 * the same settings-style "save in place" pattern `updateProfileFormAction`
 * (`/app/settings/actions.ts`) already uses, since there's nowhere more
 * useful to send someone who just edited their own trip.
 */

export interface UpdateTripFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
}

export async function updateTripFormAction(
  _prevState: UpdateTripFormState,
  formData: FormData,
): Promise<UpdateTripFormState> {
  const tripId = formData.get("tripId");
  const destination = formData.get("destination");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const travelerCount = formData.get("travelerCount");
  const tripType = formData.get("tripType");
  const tripGoals = formData.get("tripGoals");
  const notes = formData.get("notes");

  if (typeof tripId !== "string" || tripId.length === 0) {
    return { status: "error", message: "Couldn't find your trip. Please refresh and try again." };
  }

  const result = await updateTrip(tripId, {
    destination: typeof destination === "string" ? destination : "",
    startDate: typeof startDate === "string" ? startDate : "",
    endDate: typeof endDate === "string" ? endDate : "",
    travelerCount: typeof travelerCount === "string" ? travelerCount : "",
    // Cast, not validated here - `updateTrip`'s zod schema (`z.enum`) is the
    // real validation; an unrecognized value fails there with a friendly
    // "Choose a trip type" message rather than silently defaulting.
    tripType: (typeof tripType === "string" ? tripType : "") as TripType,
    tripGoals: typeof tripGoals === "string" ? tripGoals : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  if (result.status === "success") {
    return { status: "success", message: "Saved." };
  }
  return { status: result.status, message: result.message };
}

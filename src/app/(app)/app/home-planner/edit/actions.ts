"use server";

import { updateHome } from "@/lib/home-planner/homes";
import type { HomeType, OwnershipStatus } from "@/types/home-planner";

/**
 * The edit home form's Server Action - a thin wrapper around `updateHome`
 * (`@/lib/home-planner/homes`). Unlike setup's `createHomeFormAction`, this
 * stays on the page and reports a "success" state instead of redirecting -
 * the same settings-style "save in place" pattern `updateTripFormAction`
 * (`travel-planner/edit/actions.ts`) already uses, since there's nowhere
 * more useful to send someone who just edited their own home.
 */

export interface UpdateHomeFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
}

export async function updateHomeFormAction(
  _prevState: UpdateHomeFormState,
  formData: FormData,
): Promise<UpdateHomeFormState> {
  const homeId = formData.get("homeId");
  const name = formData.get("name");
  const homeType = formData.get("homeType");
  const ownershipStatus = formData.get("ownershipStatus");
  const addressLine1 = formData.get("addressLine1");
  const addressLine2 = formData.get("addressLine2");
  const city = formData.get("city");
  const state = formData.get("state");
  const postalCode = formData.get("postalCode");
  const country = formData.get("country");
  const notes = formData.get("notes");

  if (typeof homeId !== "string" || homeId.length === 0) {
    return { status: "error", message: "Couldn't find your home. Please refresh and try again." };
  }

  const result = await updateHome(homeId, {
    name: typeof name === "string" ? name : "",
    // Cast, not validated here - `updateHome`'s zod schema (`z.enum`) is
    // the real validation; an unrecognized value fails there with a
    // friendly "Choose a home type"/"Choose an ownership status" message
    // rather than silently defaulting.
    homeType: (typeof homeType === "string" ? homeType : "") as HomeType,
    ownershipStatus: (typeof ownershipStatus === "string" ? ownershipStatus : "") as OwnershipStatus,
    addressLine1: typeof addressLine1 === "string" ? addressLine1 : undefined,
    addressLine2: typeof addressLine2 === "string" ? addressLine2 : undefined,
    city: typeof city === "string" ? city : undefined,
    state: typeof state === "string" ? state : undefined,
    postalCode: typeof postalCode === "string" ? postalCode : undefined,
    country: typeof country === "string" ? country : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  if (result.status === "success") {
    return { status: "success", message: "Saved." };
  }
  return { status: result.status, message: result.message };
}

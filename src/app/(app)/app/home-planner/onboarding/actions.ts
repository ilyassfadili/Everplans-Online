"use server";

import { redirect } from "next/navigation";

import { HOME_PLANNER_PRODUCT } from "@/config/products/home-planner";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";
import { createHome } from "@/lib/home-planner/homes";
import type { HomeType, OwnershipStatus } from "@/types/home-planner";

/**
 * The home setup form's Server Action - a thin wrapper around `createHome`
 * (`@/lib/home-planner/homes`), the same split every other mutation in this
 * codebase follows (see `travel-planner/onboarding/actions.ts`'s own
 * comment). On success, redirects straight into the workspace rather than
 * returning a "success" state for the form to render - there's nothing
 * left to show on the home setup screen once the workspace exists.
 */

export interface CreateHomeFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createHomeFormAction(
  _prevState: CreateHomeFormState,
  formData: FormData,
): Promise<CreateHomeFormState> {
  // Everplans' real paywall enforcement (Prompt 6), not just the
  // onboarding page's own redirect (`./page.tsx`'s doc comment) - never
  // trust that a client reached this action only through the UI path that
  // already checked entitlement first, the same re-check
  // `createTripFormAction` (Travel Planner) already establishes.
  const user = await requireUser();
  if (!(await hasProductAccess(user.id, HOME_PLANNER_PRODUCT.plannerId))) {
    return { status: "error", message: "Purchase Home Planner to set up your home." };
  }

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

  const result = await createHome({
    name: typeof name === "string" ? name : "",
    // Cast, not validated here - `createHome`'s zod schema (`z.enum`) is
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
    redirect("/app/home-planner");
  }

  return { status: result.status, message: result.message };
}

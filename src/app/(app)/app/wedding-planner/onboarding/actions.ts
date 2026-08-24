"use server";

import { redirect } from "next/navigation";

import { createWedding } from "@/lib/wedding/weddings";

/**
 * The onboarding form's Server Action - a thin wrapper around
 * `createWedding` (`@/lib/wedding/weddings`), the same split every other
 * mutation in this codebase follows (see `/app/settings/actions.ts`'s own
 * comment). On success, redirects straight into the workspace rather than
 * returning a "success" state for the form to render - there's nothing
 * left to show on the onboarding screen once the workspace exists.
 */

export interface CreateWeddingFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createWeddingFormAction(
  _prevState: CreateWeddingFormState,
  formData: FormData,
): Promise<CreateWeddingFormState> {
  const partnerOneName = formData.get("partnerOneName");
  const partnerTwoName = formData.get("partnerTwoName");
  const weddingDate = formData.get("weddingDate");

  const result = await createWedding({
    partnerOneName: typeof partnerOneName === "string" ? partnerOneName : "",
    partnerTwoName: typeof partnerTwoName === "string" ? partnerTwoName : "",
    weddingDate: typeof weddingDate === "string" ? weddingDate : undefined,
  });

  if (result.status === "success") {
    redirect("/app/wedding-planner");
  }

  return { status: result.status, message: result.message };
}

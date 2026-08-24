"use server";

import { revalidatePath } from "next/cache";

import {
  addMonthlyPriority,
  deleteMonthlyPriority,
  reorderMonthlyPriority,
  toggleMonthlyPriorityDone,
  updateMonthlyPlanNotes,
  type AddPlanPriorityInput,
  type LifeMonthlyPlanMutationResult,
  type LifeMonthlyPriorityMutationResult,
  type LifePlanningDeleteResult,
} from "@/lib/life-planner/life-planning";
import type { PlanNotesFormState } from "../_components/plan-notes-form";
import type { AddPriorityFormState } from "../_components/plan-priorities";

/**
 * The Monthly Planning page's own Server Actions - mirrors
 * `@/app/(app)/app/life-planner/planning/weekly/actions.ts` one level up,
 * see that file's own header comment for the shape every function here
 * follows.
 */

function revalidateMonthlyPlanningPages() {
  revalidatePath("/app/life-planner/planning/monthly", "page");
  revalidatePath("/app/life-planner");
}

/** The Monthly Planning page's own "Add priority" form action - bound to `monthlyPlanId`. */
export async function addMonthlyPriorityFormAction(
  monthlyPlanId: string,
  _prevState: AddPriorityFormState,
  formData: FormData,
): Promise<AddPriorityFormState> {
  const title = formData.get("title");
  const sourceType = formData.get("sourceType");
  const sourceId = formData.get("sourceId");

  const input: AddPlanPriorityInput = {
    title: typeof title === "string" ? title : "",
    sourceType: typeof sourceType === "string" && sourceType ? (sourceType as AddPlanPriorityInput["sourceType"]) : undefined,
    sourceId: typeof sourceId === "string" ? sourceId : undefined,
  };

  const result = await addMonthlyPriority(monthlyPlanId, input);

  if (result.status === "success") {
    revalidateMonthlyPlanningPages();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function toggleMonthlyPriorityAction(id: string): Promise<LifeMonthlyPriorityMutationResult> {
  const result = await toggleMonthlyPriorityDone(id);
  if (result.status === "success") {
    revalidateMonthlyPlanningPages();
  }
  return result;
}

export async function deleteMonthlyPriorityAction(id: string): Promise<LifePlanningDeleteResult> {
  const result = await deleteMonthlyPriority(id);
  if (result.status === "success") {
    revalidateMonthlyPlanningPages();
  }
  return result;
}

export async function moveMonthlyPriorityAction(id: string, direction: "up" | "down"): Promise<LifePlanningDeleteResult> {
  const result = await reorderMonthlyPriority(id, direction);
  if (result.status === "success") {
    revalidateMonthlyPlanningPages();
  }
  return result;
}

/** The Monthly Planning page's own "Save notes" form action - bound to `monthlyPlanId`. */
export async function updateMonthlyPlanNotesFormAction(
  monthlyPlanId: string,
  _prevState: PlanNotesFormState,
  formData: FormData,
): Promise<PlanNotesFormState> {
  const notes = formData.get("notes");

  const result: LifeMonthlyPlanMutationResult = await updateMonthlyPlanNotes(monthlyPlanId, typeof notes === "string" ? notes : undefined);

  if (result.status === "success") {
    revalidateMonthlyPlanningPages();
    return { status: "success" };
  }
  return { status: result.status, message: result.message };
}

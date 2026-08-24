"use server";

import { revalidatePath } from "next/cache";

import {
  addWeeklyPriority,
  deleteWeeklyPriority,
  reorderWeeklyPriority,
  toggleWeeklyPriorityDone,
  updateWeeklyPlanNotes,
  type AddPlanPriorityInput,
  type LifePlanningDeleteResult,
  type LifeWeeklyPlanMutationResult,
  type LifeWeeklyPriorityMutationResult,
} from "@/lib/life-planner/life-planning";
import type { PlanNotesFormState } from "../_components/plan-notes-form";
import type { AddPriorityFormState } from "../_components/plan-priorities";

/**
 * The Weekly Planning page's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-planning`, the same "`useActionState`-compatible
 * wrapper for create/notes, plain async functions for toggle/delete/reorder
 * called directly from a client component" split every other Life Planner
 * module's own `actions.ts` uses.
 *
 * Every mutation revalidates the weekly planning route and the dashboard
 * (whose own compact weekly-priorities preview reads the same data) -
 * `revalidatePath` with the `"page"` type against
 * `"/app/life-planner/planning/weekly"` revalidates every `?week=` instance
 * of that route in one call, the same trick `revalidateRoutinePages`
 * (`@/app/(app)/app/life-planner/routines/actions.ts`) uses for routine
 * detail pages.
 */

function revalidateWeeklyPlanningPages() {
  revalidatePath("/app/life-planner/planning/weekly", "page");
  revalidatePath("/app/life-planner");
}

/** The Weekly Planning page's own "Add priority" form action - bound to `weeklyPlanId` the same way `addRoutineItemFormAction` binds to `routineId`. */
export async function addWeeklyPriorityFormAction(
  weeklyPlanId: string,
  _prevState: AddPriorityFormState,
  formData: FormData,
): Promise<AddPriorityFormState> {
  const title = formData.get("title");
  const sourceType = formData.get("sourceType");
  const sourceId = formData.get("sourceId");

  const input: AddPlanPriorityInput = {
    title: typeof title === "string" ? title : "",
    // Cast, not trusted blindly - `addWeeklyPriority`'s own zod schema
    // re-validates against the real enum; this only satisfies the input
    // type for a value the form's own hidden field already constrains.
    sourceType: typeof sourceType === "string" && sourceType ? (sourceType as AddPlanPriorityInput["sourceType"]) : undefined,
    sourceId: typeof sourceId === "string" ? sourceId : undefined,
  };

  const result = await addWeeklyPriority(weeklyPlanId, input);

  if (result.status === "success") {
    revalidateWeeklyPlanningPages();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function toggleWeeklyPriorityAction(id: string): Promise<LifeWeeklyPriorityMutationResult> {
  const result = await toggleWeeklyPriorityDone(id);
  if (result.status === "success") {
    revalidateWeeklyPlanningPages();
  }
  return result;
}

export async function deleteWeeklyPriorityAction(id: string): Promise<LifePlanningDeleteResult> {
  const result = await deleteWeeklyPriority(id);
  if (result.status === "success") {
    revalidateWeeklyPlanningPages();
  }
  return result;
}

export async function moveWeeklyPriorityAction(id: string, direction: "up" | "down"): Promise<LifePlanningDeleteResult> {
  const result = await reorderWeeklyPriority(id, direction);
  if (result.status === "success") {
    revalidateWeeklyPlanningPages();
  }
  return result;
}

/** The Weekly Planning page's own "Save notes" form action - bound to `weeklyPlanId`. */
export async function updateWeeklyPlanNotesFormAction(
  weeklyPlanId: string,
  _prevState: PlanNotesFormState,
  formData: FormData,
): Promise<PlanNotesFormState> {
  const notes = formData.get("notes");

  const result: LifeWeeklyPlanMutationResult = await updateWeeklyPlanNotes(weeklyPlanId, typeof notes === "string" ? notes : undefined);

  if (result.status === "success") {
    revalidateWeeklyPlanningPages();
    return { status: "success" };
  }
  return { status: result.status, message: result.message };
}

"use server";

import { revalidatePath } from "next/cache";

import {
  createActionStep,
  createMilestone,
  deleteActionStep,
  deleteMilestone,
  reorderActionStep,
  reorderMilestone,
  toggleActionStepCompletion,
  updateActionStep,
  updateMilestone,
  type CreateActionStepInput,
  type CreateMilestoneInput,
  type LifeGoalActionStepMutationResult,
  type LifeGoalMilestoneMutationResult,
  type LifeGoalPlanningDeleteResult,
  type UpdateActionStepInput,
  type UpdateMilestoneInput,
} from "@/lib/life-planner/life-goal-planning";

/**
 * The goal detail page's own Server Actions (Phase 3) - milestones and
 * action steps, both scoped to one goal at a time. Same
 * "`useActionState`-compatible wrapper for create, plain async functions for
 * edit/delete/toggle/reorder called directly from client components" split
 * `@/app/(app)/app/life-planner/areas/actions.ts` and
 * `@/app/(app)/app/life-planner/goals/actions.ts` both use.
 *
 * Every mutation here takes `goalId` explicitly (even the ones whose DAL
 * counterpart only needs a milestone/action-step `id`) purely so this file
 * can revalidate the right goal detail path without a second database
 * round trip to look `goalId` back up - the calling client component
 * already has it as a prop either way, since it's rendering that one goal's
 * page.
 *
 * Every mutation revalidates this goal's own detail page, the goals list
 * (whose cards also show `progress`), and the dashboard (whose `GoalsSection`
 * preview and "Upcoming target dates" mini-list both read the same data).
 */

function revalidateGoalPlanningPages(goalId: string) {
  revalidatePath(`/app/life-planner/goals/${goalId}`);
  revalidatePath("/app/life-planner/goals");
  revalidatePath("/app/life-planner");
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export interface CreateMilestoneFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createMilestoneFormAction(
  goalId: string,
  _prevState: CreateMilestoneFormState,
  formData: FormData,
): Promise<CreateMilestoneFormState> {
  const title = formData.get("title");
  const targetDate = formData.get("targetDate");

  const input: CreateMilestoneInput = {
    title: typeof title === "string" ? title : "",
    targetDate: typeof targetDate === "string" ? targetDate : undefined,
  };

  const result = await createMilestone(goalId, input);

  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function updateMilestoneAction(goalId: string, milestoneId: string, input: UpdateMilestoneInput): Promise<LifeGoalMilestoneMutationResult> {
  const result = await updateMilestone(milestoneId, input);
  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
  }
  return result;
}

export async function deleteMilestoneAction(goalId: string, milestoneId: string): Promise<LifeGoalPlanningDeleteResult> {
  const result = await deleteMilestone(milestoneId);
  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
  }
  return result;
}

export async function moveMilestoneAction(goalId: string, milestoneId: string, direction: "up" | "down"): Promise<LifeGoalPlanningDeleteResult> {
  const result = await reorderMilestone(milestoneId, direction);
  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Action steps
// ---------------------------------------------------------------------------

export interface CreateActionStepFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createActionStepFormAction(
  goalId: string,
  _prevState: CreateActionStepFormState,
  formData: FormData,
): Promise<CreateActionStepFormState> {
  const title = formData.get("title");
  const milestoneId = formData.get("milestoneId");

  const input: CreateActionStepInput = {
    title: typeof title === "string" ? title : "",
    milestoneId: typeof milestoneId === "string" ? milestoneId : undefined,
  };

  const result = await createActionStep(goalId, input);

  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function updateActionStepAction(
  goalId: string,
  actionStepId: string,
  input: UpdateActionStepInput,
): Promise<LifeGoalActionStepMutationResult> {
  const result = await updateActionStep(actionStepId, input);
  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
  }
  return result;
}

export async function toggleActionStepAction(goalId: string, actionStepId: string): Promise<LifeGoalActionStepMutationResult> {
  const result = await toggleActionStepCompletion(actionStepId);
  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
  }
  return result;
}

export async function deleteActionStepAction(goalId: string, actionStepId: string): Promise<LifeGoalPlanningDeleteResult> {
  const result = await deleteActionStep(actionStepId);
  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
  }
  return result;
}

export async function moveActionStepAction(goalId: string, actionStepId: string, direction: "up" | "down"): Promise<LifeGoalPlanningDeleteResult> {
  const result = await reorderActionStep(actionStepId, direction);
  if (result.status === "success") {
    revalidateGoalPlanningPages(goalId);
  }
  return result;
}

"use server";

import { revalidatePath } from "next/cache";

import { createMilestone, updateMilestoneStatus } from "@/lib/wedding/milestones";
import { createTask, updateTask, type UpdateTaskInput } from "@/lib/wedding/tasks";
import type { TaskMutationResult } from "@/lib/wedding/tasks";
import type { WeddingPlanningStatus } from "@/types/wedding";

/**
 * Shared Server Actions for the Wedding Planner section - thin wrappers
 * around `@/lib/wedding/{milestones,tasks}`, the same split every other
 * mutation in this codebase follows. Lives at the `wedding-planner/`
 * segment root, not inside a single route's folder, because both the
 * dashboard (`page.tsx`) and the checklist (`checklist/page.tsx`) render
 * client components that call these same actions - milestones only ever
 * appear on the dashboard, but tasks are mutated from both places and need
 * to stay in sync.
 *
 * Every mutation revalidates both routes: a status change made from the
 * checklist should be reflected in the dashboard's "needs attention"
 * preview without a manual refresh, and vice versa - one source of truth
 * (the database), two views that both stay current.
 */

const WEDDING_PLANNER_PATH = "/app/wedding-planner";
const CHECKLIST_PATH = "/app/wedding-planner/checklist";

function revalidateWeddingPlanner() {
  revalidatePath(WEDDING_PLANNER_PATH);
  revalidatePath(CHECKLIST_PATH);
}

export interface CreateMilestoneFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createMilestoneFormAction(
  weddingId: string,
  _prevState: CreateMilestoneFormState,
  formData: FormData,
): Promise<CreateMilestoneFormState> {
  const title = formData.get("title");
  const targetDate = formData.get("targetDate");

  const result = await createMilestone(weddingId, {
    title: typeof title === "string" ? title : "",
    targetDate: typeof targetDate === "string" ? targetDate : undefined,
  });

  if (result.status === "success") {
    revalidateWeddingPlanner();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function setMilestoneStatusAction(milestoneId: string, status: WeddingPlanningStatus): Promise<void> {
  await updateMilestoneStatus(milestoneId, status);
  revalidateWeddingPlanner();
}

export interface CreateTaskFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createTaskFormAction(
  weddingId: string,
  _prevState: CreateTaskFormState,
  formData: FormData,
): Promise<CreateTaskFormState> {
  const title = formData.get("title");
  const priority = formData.get("priority");
  const dueDate = formData.get("dueDate");
  const milestoneId = formData.get("milestoneId");

  const result = await createTask(weddingId, {
    title: typeof title === "string" ? title : "",
    priority: priority === "low" || priority === "medium" || priority === "high" ? priority : undefined,
    dueDate: typeof dueDate === "string" ? dueDate : undefined,
    milestoneId: typeof milestoneId === "string" ? milestoneId : undefined,
  });

  if (result.status === "success") {
    revalidateWeddingPlanner();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

/** The checklist's fast status toggle and the dashboard's "mark done" control - no form, called directly from a button's click handler. */
export async function setTaskStatusAction(taskId: string, status: WeddingPlanningStatus): Promise<void> {
  await updateTask(taskId, { status });
  revalidateWeddingPlanner();
}

/** The checklist's inline "edit task" row - title/priority/due date/milestone, whichever the caller actually changed. */
export async function editTaskAction(taskId: string, input: UpdateTaskInput): Promise<TaskMutationResult> {
  const result = await updateTask(taskId, input);
  if (result.status === "success") {
    revalidateWeddingPlanner();
  }
  return result;
}

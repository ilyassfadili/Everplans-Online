"use server";

import { revalidatePath } from "next/cache";

import {
  archiveTask,
  completeTask,
  createTask,
  deleteTask,
  reopenTask,
  updateTask,
  type CreateTaskInput,
  type DeleteTaskResult,
  type LifeTaskMutationResult,
  type UpdateTaskInput,
} from "@/lib/life-planner/life-tasks";

import { normalizeAreaId } from "../goals/_components/goal-area-select";
import { normalizeGoalId } from "./_components/task-goal-select";

/**
 * The Tasks module's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-tasks`, the same "`useActionState`-compatible
 * wrapper for create, plain async functions for edit/complete/reopen/
 * archive/delete called directly from client components" split
 * `@/app/(app)/app/life-planner/goals/actions.ts` uses.
 *
 * Every mutation revalidates the tasks list, every task detail page, every
 * goal detail page (whose own "Tasks for this goal" section reads the same
 * data), and the dashboard (whose "Today's priorities" section does too).
 * `revalidatePath` with the `"page"` type against a route's own dynamic
 * segment (`"/app/life-planner/tasks/[taskId]"`,
 * `"/app/life-planner/goals/[goalId]"`) revalidates every instance of that
 * route in one call, rather than needing to know which specific task/goal
 * id a mutation actually touched.
 */

function revalidateTaskPages() {
  revalidatePath("/app/life-planner/tasks");
  revalidatePath("/app/life-planner/tasks/[taskId]", "page");
  revalidatePath("/app/life-planner/goals/[goalId]", "page");
  revalidatePath("/app/life-planner");
}

export interface CreateTaskFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/**
 * The tasks list's own create action - shared by the inline quick-add form
 * (title + due date + priority only) and the "New task" full form (every
 * field). Unlike `createLifeGoalFormAction`, this never redirects - both
 * forms it backs live on the list page itself, and stay there on success.
 */
export async function createTaskFormAction(_prevState: CreateTaskFormState, formData: FormData): Promise<CreateTaskFormState> {
  const title = formData.get("title");
  const description = formData.get("description");
  const lifeAreaId = formData.get("lifeAreaId");
  const goalId = formData.get("goalId");
  const dueDate = formData.get("dueDate");
  const priority = formData.get("priority");

  const input: CreateTaskInput = {
    title: typeof title === "string" ? title : "",
    description: typeof description === "string" ? description : undefined,
    lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : undefined,
    goalId: typeof goalId === "string" ? normalizeGoalId(goalId) : undefined,
    dueDate: typeof dueDate === "string" ? dueDate : undefined,
    // Cast, not trusted blindly - `createTask`'s own zod schema re-validates
    // against the real enum; this only satisfies the input type for a value
    // the form's own `<Select>` already constrains.
    priority: typeof priority === "string" && priority ? (priority as CreateTaskInput["priority"]) : undefined,
  };

  const result = await createTask(input);

  if (result.status === "success") {
    revalidateTaskPages();
    return { status: "idle" };
  }

  return { status: result.status, message: result.message };
}

export async function updateTaskAction(taskId: string, input: UpdateTaskInput): Promise<LifeTaskMutationResult> {
  const result = await updateTask(taskId, input);
  if (result.status === "success") {
    revalidateTaskPages();
  }
  return result;
}

export async function completeTaskAction(taskId: string): Promise<LifeTaskMutationResult> {
  const result = await completeTask(taskId);
  if (result.status === "success") {
    revalidateTaskPages();
  }
  return result;
}

export async function reopenTaskAction(taskId: string): Promise<LifeTaskMutationResult> {
  const result = await reopenTask(taskId);
  if (result.status === "success") {
    revalidateTaskPages();
  }
  return result;
}

export async function archiveTaskAction(taskId: string): Promise<LifeTaskMutationResult> {
  const result = await archiveTask(taskId);
  if (result.status === "success") {
    revalidateTaskPages();
  }
  return result;
}

export async function deleteTaskAction(taskId: string): Promise<DeleteTaskResult> {
  const result = await deleteTask(taskId);
  if (result.status === "success") {
    revalidateTaskPages();
  }
  return result;
}

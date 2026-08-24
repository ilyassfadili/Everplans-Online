"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  completeMaintenanceTask,
  createMaintenanceTask,
  deleteMaintenanceTask,
  reopenMaintenanceTask,
  setMaintenanceRecurrenceActive,
  updateMaintenanceTask,
} from "@/lib/home-planner/maintenance";
import type { MaintenanceCategory, MaintenancePriority } from "@/types/home-planner";

/**
 * The maintenance feature's own Server Actions - thin wrappers around
 * `@/lib/home-planner/maintenance`, colocated here since every route under
 * `/app/home-planner/maintenance` shares them, the same shape
 * `rooms/actions.ts` establishes for a single feature area.
 */

const MAINTENANCE_PATH = "/app/home-planner/maintenance";
const HOME_PLANNER_PATH = "/app/home-planner";

function revalidateMaintenance() {
  revalidatePath(MAINTENANCE_PATH);
  revalidatePath(HOME_PLANNER_PATH);
}

function readTaskInput(formData: FormData) {
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const priority = formData.get("priority");
  const roomId = formData.get("roomId");
  const dueDate = formData.get("dueDate");
  const notes = formData.get("notes");
  const recurrenceFrequency = formData.get("recurrenceFrequency");
  const recurrenceIntervalDays = formData.get("recurrenceIntervalDays");

  return {
    name: typeof name === "string" ? name : "",
    description: typeof description === "string" ? description : undefined,
    // Cast, not validated here - `createMaintenanceTask`/`updateMaintenanceTask`'s
    // zod schema (`z.enum`) is the real validation; an unrecognized value
    // fails there with a friendly "Choose a category"/"Choose a priority"
    // message rather than silently defaulting.
    category: (typeof category === "string" ? category : "") as MaintenanceCategory,
    priority: (typeof priority === "string" ? priority : "") as MaintenancePriority,
    roomId: typeof roomId === "string" ? roomId : undefined,
    dueDate: typeof dueDate === "string" ? dueDate : undefined,
    notes: typeof notes === "string" ? notes : undefined,
    // Cast, not validated here - same reasoning as `category`/`priority`
    // above; an unrecognized value falls through to the schema's own
    // validation.
    recurrenceFrequency: (typeof recurrenceFrequency === "string" ? recurrenceFrequency : "none") as
      | "none"
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly"
      | "yearly"
      | "custom",
    recurrenceIntervalDays: typeof recurrenceIntervalDays === "string" ? recurrenceIntervalDays : undefined,
  };
}

export interface CreateMaintenanceTaskFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/** Creates a task, then redirects into its own detail page - there's nothing left to show on the "new task" screen once the task exists. */
export async function createMaintenanceTaskFormAction(
  homeId: string,
  _prevState: CreateMaintenanceTaskFormState,
  formData: FormData,
): Promise<CreateMaintenanceTaskFormState> {
  const result = await createMaintenanceTask(homeId, readTaskInput(formData));

  if (result.status === "success") {
    revalidateMaintenance();
    redirect(`/app/home-planner/maintenance/${result.task.id}`);
  }
  return { status: result.status, message: result.message };
}

export interface UpdateMaintenanceTaskFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
}

/** Edits a task in place - the same "stay on the page, report success" pattern `updateRoomFormAction` uses. */
export async function updateMaintenanceTaskFormAction(
  taskId: string,
  _prevState: UpdateMaintenanceTaskFormState,
  formData: FormData,
): Promise<UpdateMaintenanceTaskFormState> {
  const result = await updateMaintenanceTask(taskId, readTaskInput(formData));

  if (result.status === "success") {
    revalidateMaintenance();
    return { status: "success", message: "Saved." };
  }
  return { status: result.status, message: result.message };
}

export async function deleteMaintenanceTaskAction(taskId: string): Promise<void> {
  await deleteMaintenanceTask(taskId);
  revalidateMaintenance();
  redirect(MAINTENANCE_PATH);
}

/** Marks a task complete - an instant-save toggle, no form, the same "save automatically for simple state" pattern `toggleItemImportantAction` (Inventory) already establishes. */
export async function completeTaskAction(taskId: string): Promise<void> {
  await completeMaintenanceTask(taskId);
  revalidateMaintenance();
}

/** Reopens a completed task - clears its `completed_at`. */
export async function reopenTaskAction(taskId: string): Promise<void> {
  await reopenMaintenanceTask(taskId);
  revalidateMaintenance();
}

/** Pauses or resumes a recurring task's series (Phase 2: "pause/disable recurrence if appropriate"). */
export async function setRecurrenceActiveAction(taskId: string, active: boolean): Promise<void> {
  await setMaintenanceRecurrenceActive(taskId, active);
  revalidateMaintenance();
}

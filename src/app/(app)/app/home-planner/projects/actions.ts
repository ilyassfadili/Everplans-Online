"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createProjectTask, deleteProjectTask, setProjectTaskCompleted } from "@/lib/home-planner/project-tasks";
import { createProject, deleteProject, updateProject } from "@/lib/home-planner/projects";
import type { ProjectCategory, ProjectStatus } from "@/types/home-planner";

/**
 * The projects feature's own Server Actions - thin wrappers around
 * `@/lib/home-planner/projects` and `@/lib/home-planner/project-tasks`,
 * colocated here since every route under `/app/home-planner/projects`
 * shares them (the same "one combined feature area" framing
 * `wedding-planner/notes/actions.ts` uses for notes/decisions/documents).
 */

const PROJECTS_PATH = "/app/home-planner/projects";
const HOME_PLANNER_PATH = "/app/home-planner";

function revalidateProjects() {
  revalidatePath(PROJECTS_PATH);
  revalidatePath(HOME_PLANNER_PATH);
}

function readProjectInput(formData: FormData) {
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const status = formData.get("status");
  const roomId = formData.get("roomId");
  const startDate = formData.get("startDate");
  const targetCompletionDate = formData.get("targetCompletionDate");
  const budgetPlannedDollars = formData.get("budgetPlannedDollars");
  const budgetUsedDollars = formData.get("budgetUsedDollars");
  const notes = formData.get("notes");

  return {
    name: typeof name === "string" ? name : "",
    description: typeof description === "string" ? description : undefined,
    // Cast, not validated here - `createProject`/`updateProject`'s zod
    // schema (`z.enum`) is the real validation; an unrecognized value
    // fails there with a friendly "Choose a category"/"Choose a status"
    // message rather than silently defaulting.
    category: (typeof category === "string" ? category : "") as ProjectCategory,
    status: (typeof status === "string" ? status : "") as ProjectStatus,
    roomId: typeof roomId === "string" ? roomId : undefined,
    startDate: typeof startDate === "string" ? startDate : undefined,
    targetCompletionDate: typeof targetCompletionDate === "string" ? targetCompletionDate : undefined,
    budgetPlannedDollars: typeof budgetPlannedDollars === "string" ? budgetPlannedDollars : undefined,
    budgetUsedDollars: typeof budgetUsedDollars === "string" ? budgetUsedDollars : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  };
}

export interface CreateProjectFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/** Creates a project, then redirects into its own detail page. */
export async function createProjectFormAction(
  homeId: string,
  _prevState: CreateProjectFormState,
  formData: FormData,
): Promise<CreateProjectFormState> {
  const result = await createProject(homeId, readProjectInput(formData));

  if (result.status === "success") {
    revalidateProjects();
    redirect(`/app/home-planner/projects/${result.project.id}`);
  }
  return { status: result.status, message: result.message };
}

export interface UpdateProjectFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
}

/** Edits a project in place - the same "stay on the page, report success" pattern every other Home Planner edit form uses. */
export async function updateProjectFormAction(
  projectId: string,
  _prevState: UpdateProjectFormState,
  formData: FormData,
): Promise<UpdateProjectFormState> {
  const result = await updateProject(projectId, readProjectInput(formData));

  if (result.status === "success") {
    revalidateProjects();
    return { status: "success", message: "Saved." };
  }
  return { status: result.status, message: result.message };
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  await deleteProject(projectId);
  revalidateProjects();
  redirect(PROJECTS_PATH);
}

export interface CreateProjectTaskFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createProjectTaskFormAction(
  projectId: string,
  _prevState: CreateProjectTaskFormState,
  formData: FormData,
): Promise<CreateProjectTaskFormState> {
  const name = formData.get("name");
  const dueDate = formData.get("dueDate");

  const result = await createProjectTask(projectId, {
    name: typeof name === "string" ? name : "",
    dueDate: typeof dueDate === "string" ? dueDate : undefined,
  });

  if (result.status === "success") {
    revalidateProjects();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

/** Toggles a project task's completion - the instant-save pattern every task-completion control in this product uses. */
export async function toggleProjectTaskAction(taskId: string, isCompleted: boolean): Promise<void> {
  await setProjectTaskCompleted(taskId, isCompleted);
  revalidateProjects();
}

export async function removeProjectTaskAction(taskId: string): Promise<void> {
  await deleteProjectTask(taskId);
  revalidateProjects();
}

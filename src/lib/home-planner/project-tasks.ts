import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectTask } from "@/types/home-planner";

/**
 * Home Project tasks - `public.home_project_tasks`
 * (`supabase/migrations/20260910000009_home_projects.sql`), a child table
 * of `public.home_projects`. Same shape as `@/lib/wedding/tasks`: every
 * function calls `requireUser()` itself, and RLS (a join through
 * `home_projects` up to `homes.owner_id`) independently enforces the same
 * boundary.
 */

const TASK_COLUMNS = "id, project_id, name, is_completed, due_date, notes, sort_order, created_at, updated_at";

type TaskRow = {
  id: string;
  project_id: string;
  name: string;
  is_completed: boolean;
  due_date: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapTaskRow(row: TaskRow): ProjectTask {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    isCompleted: row.is_completed,
    dueDate: row.due_date,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTasksForProject(projectId: string): Promise<ProjectTask[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_project_tasks")
    .select(TASK_COLUMNS)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getTasksForProject: failed to load project tasks", error);
    return [];
  }

  return (data ?? []).map(mapTaskRow);
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Enter a task name.").max(150, "Keep it under 150 characters."),
  dueDate: optionalTextSchema(10, "Enter a valid date."),
  notes: optionalTextSchema(1000, "Keep it under 1000 characters."),
});

export type CreateProjectTaskInput = z.input<typeof createTaskSchema>;

export type ProjectTaskMutationResult =
  | { status: "success"; task: ProjectTask }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Task creation - name, and optional due date/notes, the same minimal shape every other "small item in a list" entity in this product uses. */
export async function createProjectTask(projectId: string, input: CreateProjectTaskInput): Promise<ProjectTaskMutationResult> {
  await requireUser();

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("home_project_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { data, error } = await supabase
    .from("home_project_tasks")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      due_date: parsed.data.dueDate,
      notes: parsed.data.notes,
      sort_order: count ?? 0,
    })
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createProjectTask: failed to create project task", error);
    return { status: "error", message: "Couldn't add that task. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

/** Toggles a task's completion - the instant-save toggle every task-completion control in this product uses. */
export async function setProjectTaskCompleted(taskId: string, isCompleted: boolean): Promise<ProjectTaskMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_project_tasks")
    .update({ is_completed: isCompleted })
    .eq("id", taskId)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("setProjectTaskCompleted: failed to update project task", error);
    return { status: "error", message: "Couldn't update that task. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

export type DeleteProjectTaskResult = { status: "success" } | { status: "error"; message: string };

export async function deleteProjectTask(taskId: string): Promise<DeleteProjectTaskResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("home_project_tasks").delete().eq("id", taskId);

  if (error) {
    console.error("deleteProjectTask: failed to delete project task", error);
    return { status: "error", message: "Couldn't remove that task. Please try again." };
  }

  return { status: "success" };
}

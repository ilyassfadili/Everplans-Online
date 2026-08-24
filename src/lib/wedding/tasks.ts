import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeddingPlanningStatus, WeddingTask, WeddingTaskPriority } from "@/types/wedding";

/**
 * Wedding Planner tasks - `public.wedding_tasks`
 * (`supabase/migrations/20260824000000_wedding_planning_core.sql`). Same
 * shape as `@/lib/wedding/milestones`: every function calls `requireUser()`
 * itself, and RLS (a join back to `weddings.owner_id`) independently
 * enforces the same "only this wedding's owner" boundary.
 */

const TASK_COLUMNS =
  "id, wedding_id, milestone_id, event_id, title, description, status, priority, due_date, completed_at, sort_order, created_at, updated_at";

type TaskRow = {
  id: string;
  wedding_id: string;
  milestone_id: string | null;
  event_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapTaskRow(row: TaskRow): WeddingTask {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    milestoneId: row.milestone_id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    // Cast, not re-validated: `wedding_tasks_status_valid`/
    // `wedding_tasks_priority_valid` (the migration) already guarantee the
    // database can never hold anything outside these unions.
    status: row.status as WeddingPlanningStatus,
    priority: row.priority as WeddingTaskPriority,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** All of a wedding's tasks - the checklist page's own filtering/sorting happens client-side over this full list, not as separate queries per view. */
export async function getTasksForWedding(weddingId: string): Promise<WeddingTask[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_tasks")
    .select(TASK_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getTasksForWedding: failed to load tasks", error);
    return [];
  }

  return (data ?? []).map(mapTaskRow);
}

const taskFieldsSchema = {
  title: z.string().trim().min(1, "Give this task a title.").max(150, "Keep it under 150 characters."),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  milestoneId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  eventId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
};

const createTaskSchema = z.object({
  title: taskFieldsSchema.title,
  priority: taskFieldsSchema.priority.default("medium"),
  dueDate: taskFieldsSchema.dueDate,
  milestoneId: taskFieldsSchema.milestoneId,
  eventId: taskFieldsSchema.eventId,
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;

export type TaskMutationResult =
  | { status: "success"; task: WeddingTask }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Appends a new task to the end of the wedding's checklist - quick, minimal-field creation (Phase 3: "avoid unnecessary fields"). */
export async function createTask(weddingId: string, input: CreateTaskInput): Promise<TaskMutationResult> {
  await requireUser();

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("wedding_tasks")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", weddingId);

  const { data, error } = await supabase
    .from("wedding_tasks")
    .insert({
      wedding_id: weddingId,
      milestone_id: parsed.data.milestoneId,
      event_id: parsed.data.eventId,
      title: parsed.data.title,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
      sort_order: count ?? 0,
    })
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createTask: failed to create task", error);
    return { status: "error", message: "Couldn't add that task. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

const updateTaskSchema = z.object({
  title: taskFieldsSchema.title.optional(),
  status: z.enum(["not-started", "in-progress", "completed"]).optional(),
  priority: taskFieldsSchema.priority.optional(),
  dueDate: taskFieldsSchema.dueDate,
  milestoneId: taskFieldsSchema.milestoneId,
  eventId: taskFieldsSchema.eventId,
});

export type UpdateTaskInput = z.input<typeof updateTaskSchema>;

/**
 * Edits a task - one function for both the full "edit task" sheet and the
 * checklist's quick status toggle, since both are "change some subset of
 * this task's fields" (only the fields actually present in `input` are
 * written, the same partial-patch approach `updateProfilePreferences`
 * uses). `completed_at` is set/cleared here, alongside `status`, rather
 * than as a field the caller can set directly - it's derived from status,
 * never independently editable.
 */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<TaskMutationResult> {
  await requireUser();

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    title?: string;
    status?: string;
    priority?: string;
    due_date?: string | null;
    milestone_id?: string | null;
    event_id?: string | null;
    completed_at?: string | null;
  } = {};

  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;
  // `dueDate`/`milestoneId`/`eventId` use `.optional().transform(v => v ?
  // v : null)` (`taskFieldsSchema`) - the transform runs even when the
  // field is absent, so `parsed.data.dueDate` is `null`, never
  // `undefined`, for an omitted key. Checking presence on the raw `input`
  // (not the parsed output) is what makes "leave the due date alone" (key
  // omitted) and "clear the due date" (key present, empty) distinguishable
  // - without this, `updateTask(id, { status })` would silently wipe all
  // three fields.
  if (Object.hasOwn(input, "dueDate")) patch.due_date = parsed.data.dueDate;
  if (Object.hasOwn(input, "milestoneId")) patch.milestone_id = parsed.data.milestoneId;
  if (Object.hasOwn(input, "eventId")) patch.event_id = parsed.data.eventId;
  if (parsed.data.status !== undefined) {
    patch.status = parsed.data.status;
    patch.completed_at = parsed.data.status === "completed" ? new Date().toISOString() : null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_tasks").update(patch).eq("id", taskId).select(TASK_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateTask: failed to update task", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateNextDueDate } from "@/lib/home-planner/recurrence";
import type { MaintenanceCategory, MaintenancePriority, MaintenanceRecurrenceFrequency, MaintenanceTask } from "@/types/home-planner";

/**
 * Home Planner maintenance tasks - `public.home_maintenance_tasks`
 * (`supabase/migrations/20260910000005_home_maintenance.sql`,
 * `20260910000006_home_maintenance_recurrence.sql`). Same shape as
 * `@/lib/home-planner/rooms`/`@/lib/home-planner/inventory`: every function
 * calls `requireUser()` itself, and RLS (a join back to `homes.owner_id`)
 * independently enforces the same "only this home's owner" boundary.
 */

const TASK_COLUMNS =
  "id, home_id, room_id, name, description, category, priority, due_date, notes, completed_at, recurrence_frequency, recurrence_interval_days, recurrence_active, series_root_id, created_at, updated_at";

const CATEGORIES = [
  "hvac",
  "plumbing",
  "electrical",
  "appliances",
  "cleaning",
  "safety",
  "exterior",
  "garden",
  "general",
  "other",
] as const satisfies readonly MaintenanceCategory[];

const PRIORITIES = ["low", "medium", "high"] as const satisfies readonly MaintenancePriority[];

const RECURRENCE_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const satisfies readonly MaintenanceRecurrenceFrequency[];

type TaskRow = {
  id: string;
  home_id: string;
  room_id: string | null;
  name: string;
  description: string | null;
  category: string;
  priority: string;
  due_date: string | null;
  notes: string | null;
  completed_at: string | null;
  recurrence_frequency: string | null;
  recurrence_interval_days: number | null;
  recurrence_active: boolean;
  series_root_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapTaskRow(row: TaskRow): MaintenanceTask {
  return {
    id: row.id,
    homeId: row.home_id,
    roomId: row.room_id,
    name: row.name,
    description: row.description,
    // Cast, not re-validated: `home_maintenance_tasks_category_valid`/
    // `_priority_valid`/`_recurrence_frequency_valid` (the migrations)
    // already guarantee the database can never hold anything outside
    // these unions.
    category: row.category as MaintenanceCategory,
    priority: row.priority as MaintenancePriority,
    dueDate: row.due_date,
    notes: row.notes,
    completedAt: row.completed_at,
    recurrenceFrequency: row.recurrence_frequency as MaintenanceRecurrenceFrequency | null,
    recurrenceIntervalDays: row.recurrence_interval_days,
    recurrenceActive: row.recurrence_active,
    seriesRootId: row.series_root_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMaintenanceTasksForHome(homeId: string): Promise<MaintenanceTask[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_maintenance_tasks")
    .select(TASK_COLUMNS)
    .eq("home_id", homeId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("getMaintenanceTasksForHome: failed to load maintenance tasks", error);
    return [];
  }

  return (data ?? []).map(mapTaskRow);
}

export async function getMaintenanceTaskById(homeId: string, taskId: string): Promise<MaintenanceTask | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_maintenance_tasks")
    .select(TASK_COLUMNS)
    .eq("id", taskId)
    .eq("home_id", homeId)
    .maybeSingle();

  if (error) {
    console.error("getMaintenanceTaskById: failed to load maintenance task", error);
    return null;
  }

  return data ? mapTaskRow(data) : null;
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const taskSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a task name.").max(150, "Keep it under 150 characters."),
    description: optionalTextSchema(1000, "Keep it under 1000 characters."),
    category: z.enum(CATEGORIES, { message: "Choose a category." }),
    priority: z.enum(PRIORITIES, { message: "Choose a priority." }),
    roomId: optionalIdSchema,
    dueDate: optionalTextSchema(10, "Enter a valid date."),
    notes: optionalTextSchema(2000, "Keep it under 2000 characters."),
    // "none" (a real Select option, `RECURRENCE_FREQUENCY_OPTIONS`) means
    // "not recurring" - transformed to `null`, matching the migration's own
    // "null means not recurring" convention exactly, so this input maps
    // onto the stored column without a separate boolean flag.
    recurrenceFrequency: z
      .union([z.enum(RECURRENCE_FREQUENCIES), z.literal("none")])
      .optional()
      .transform((value) => (value && value !== "none" ? value : null)),
    recurrenceIntervalDays: z.coerce
      .number()
      .int("Whole numbers only.")
      .min(1, "At least 1 day.")
      .max(3650, "Keep it to 3650 days or fewer.")
      .optional()
      .transform((value) => value ?? null),
  })
  .refine((data) => data.recurrenceFrequency !== "custom" || data.recurrenceIntervalDays !== null, {
    message: "Enter a custom interval in days.",
    path: ["recurrenceIntervalDays"],
  });

export type MaintenanceTaskInput = z.input<typeof taskSchema>;

export type MaintenanceTaskMutationResult =
  | { status: "success"; task: MaintenanceTask }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Task creation (Phase 1: "avoid unnecessary complexity") - name, category, priority, optional room/due date/description/notes/recurrence. */
export async function createMaintenanceTask(homeId: string, input: MaintenanceTaskInput): Promise<MaintenanceTaskMutationResult> {
  await requireUser();

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_maintenance_tasks")
    .insert({
      home_id: homeId,
      room_id: parsed.data.roomId,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
      notes: parsed.data.notes,
      recurrence_frequency: parsed.data.recurrenceFrequency,
      recurrence_interval_days: parsed.data.recurrenceFrequency === "custom" ? parsed.data.recurrenceIntervalDays : null,
    })
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createMaintenanceTask: failed to create task", error);
    return { status: "error", message: "Couldn't add that task. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

/** Edits a task - ships every field editable from day one, the same shape `updateRoom` follows. */
export async function updateMaintenanceTask(taskId: string, input: MaintenanceTaskInput): Promise<MaintenanceTaskMutationResult> {
  await requireUser();

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_maintenance_tasks")
    .update({
      room_id: parsed.data.roomId,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
      notes: parsed.data.notes,
      recurrence_frequency: parsed.data.recurrenceFrequency,
      recurrence_interval_days: parsed.data.recurrenceFrequency === "custom" ? parsed.data.recurrenceIntervalDays : null,
    })
    .eq("id", taskId)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateMaintenanceTask: failed to update task", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

/**
 * Marks a task complete - sets `completed_at` to now, the one real, stored
 * fact a task's status derives from. If this task recurs and its
 * recurrence is active, this also generates the series' next occurrence
 * (Phase 2's core behavior: "complete the current occurrence, have the
 * next occurrence generated/scheduled correctly").
 *
 * Duplicate-safe the same way `createHome`/`createTrip` are: the partial
 * unique index (`home_maintenance_tasks_series_one_open_idx`, the
 * migration) guarantees at most one open occurrence per series. A `23505`
 * here means a concurrent completion already generated the next
 * occurrence - treated as success, not an error, since the real goal
 * (exactly one open next occurrence existing) is already satisfied.
 */
export async function completeMaintenanceTask(taskId: string): Promise<MaintenanceTaskMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_maintenance_tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("completeMaintenanceTask: failed to complete task", error);
    return { status: "error", message: "Couldn't complete that task. Please try again." };
  }

  const completed = mapTaskRow(data);

  if (completed.recurrenceFrequency && completed.recurrenceActive) {
    const anchorDate = completed.dueDate ?? completed.completedAt!.slice(0, 10);
    const nextDueDate = calculateNextDueDate(anchorDate, completed.recurrenceFrequency, completed.recurrenceIntervalDays);
    const seriesRootId = completed.seriesRootId ?? completed.id;

    const { error: generateError } = await supabase.from("home_maintenance_tasks").insert({
      home_id: completed.homeId,
      room_id: completed.roomId,
      name: completed.name,
      description: completed.description,
      category: completed.category,
      priority: completed.priority,
      due_date: nextDueDate,
      notes: completed.notes,
      recurrence_frequency: completed.recurrenceFrequency,
      recurrence_interval_days: completed.recurrenceIntervalDays,
      recurrence_active: true,
      series_root_id: seriesRootId,
    });

    // `23505` (unique violation) on the partial index means a concurrent
    // completion already generated this series' next occurrence - not a
    // real error, so it's silently accepted rather than surfaced.
    if (generateError && generateError.code !== "23505") {
      console.error("completeMaintenanceTask: failed to generate next occurrence", generateError, { userId: user.id });
    }
  }

  return { status: "success", task: completed };
}

/** Reopens a completed task - clears `completed_at`. */
export async function reopenMaintenanceTask(taskId: string): Promise<MaintenanceTaskMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_maintenance_tasks")
    .update({ completed_at: null })
    .eq("id", taskId)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("reopenMaintenanceTask: failed to reopen task", error);
    return { status: "error", message: "Couldn't reopen that task. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

/** Pauses or resumes a recurring task's series - completing a paused task still completes it, but generates no next occurrence. */
export async function setMaintenanceRecurrenceActive(taskId: string, active: boolean): Promise<MaintenanceTaskMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_maintenance_tasks")
    .update({ recurrence_active: active })
    .eq("id", taskId)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("setMaintenanceRecurrenceActive: failed to update task", error);
    return { status: "error", message: "Couldn't update that task. Please try again." };
  }

  return { status: "success", task: mapTaskRow(data) };
}

export type DeleteMaintenanceTaskResult = { status: "success" } | { status: "error"; message: string };

export async function deleteMaintenanceTask(taskId: string): Promise<DeleteMaintenanceTaskResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("home_maintenance_tasks").delete().eq("id", taskId);

  if (error) {
    console.error("deleteMaintenanceTask: failed to delete task", error);
    return { status: "error", message: "Couldn't remove that task. Please try again." };
  }

  return { status: "success" };
}

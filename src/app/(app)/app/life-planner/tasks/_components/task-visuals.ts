import type { LifeTask, LifeTaskPriority, LifeTaskStatus } from "@/types/life-planner";

/**
 * Resolves a Life Task's serializable `status`/`priority` into label + badge
 * tint, plus the "is this overdue" helper every row/filter needs - the same
 * "data carries a string key, a lookup map resolves it" split
 * `goal-visuals.ts` already establishes for Life Goals. Plain,
 * framework-agnostic module (no `"use client"`) so the list page (Server
 * Component), its client-side rows/forms, and the dashboard's "Today's
 * priorities" section can all import it directly.
 */

export const STATUS_LABEL: Record<LifeTaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
};

export const STATUS_BADGE: Record<LifeTaskStatus, "neutral" | "brand" | "success"> = {
  todo: "neutral",
  in_progress: "brand",
  completed: "success",
};

export const STATUS_OPTIONS: { value: LifeTaskStatus; label: string }[] = [
  { value: "todo", label: STATUS_LABEL.todo },
  { value: "in_progress", label: STATUS_LABEL.in_progress },
  { value: "completed", label: STATUS_LABEL.completed },
];

export const PRIORITY_LABEL: Record<LifeTaskPriority, string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
};

export const PRIORITY_OPTIONS: { value: LifeTaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/** `outline` (a plain bordered chip) for `low`/`medium`, the same "priority isn't a status" reasoning `goal-visuals.ts`'s own `PRIORITY_BADGE` documents; only `high` gets a warning tint. */
export const PRIORITY_BADGE: Record<LifeTaskPriority, "outline" | "warning"> = {
  low: "outline",
  medium: "outline",
  high: "warning",
};

/** Same local-midnight parse + short format every date display in this codebase uses (`DatePicker`'s own `dateFormatter`, `goal-visuals.ts`'s own `formatGoalDate`) - never `toISOString()`, which is UTC and can land on the wrong day near midnight. */
export function formatTaskDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Today's local calendar date as `YYYY-MM-DD` - the same construction the DAL's own `todayIso` (`@/lib/life-planner/life-tasks`) uses, kept as its own small copy here since this module is framework-agnostic and the DAL's own helper isn't exported. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** A task reads as overdue only while it's still open - a completed task that happened to finish after its own due date isn't "overdue," it's done. */
export function isTaskOverdue(task: Pick<LifeTask, "dueDate" | "status">): boolean {
  if (!task.dueDate || task.status === "completed") return false;
  return task.dueDate < todayIso();
}

/** A task is due today when its date matches today exactly, regardless of status - used by the tasks list's "Today & Overdue" filter alongside `isTaskOverdue`. */
export function isTaskDueToday(task: Pick<LifeTask, "dueDate">): boolean {
  return task.dueDate === todayIso();
}

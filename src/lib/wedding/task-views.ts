import type { WeddingTask } from "@/types/wedding";

/**
 * Pure derivations over an already-fetched task list - no database access
 * (deliberately not `server-only`: nothing here needs to be, and a plain
 * module is trivially reusable from either a Server or Client Component).
 * Both functions read `dueDate` as a plain `YYYY-MM-DD` calendar day and
 * compare against local midnight - see `DueDateBadge`'s own comment on
 * why that, not UTC, is the correct comparison for a date with no time
 * component.
 */

function startOfToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function dueDateTime(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00`);
  due.setHours(0, 0, 0, 0);
  return due.getTime();
}

function isIncomplete(task: WeddingTask): boolean {
  return task.status !== "completed";
}

/**
 * The dashboard's single "what needs my attention" list (Phase 1 §"Important/
 * high-priority items" + "Upcoming planning items", deliberately merged
 * into one panel rather than two near-identical ones - Phase 1's own
 * "avoid excessive cards" instruction). Ordered overdue first, then due
 * today, then the soonest upcoming due dates, then incomplete high-priority
 * tasks with no due date at all - each task appears once, in its most
 * urgent bucket.
 */
export function getTasksNeedingAttention(tasks: WeddingTask[], limit = 5): WeddingTask[] {
  const today = startOfToday();
  const incomplete = tasks.filter(isIncomplete);

  const overdue = incomplete.filter((task) => task.dueDate && dueDateTime(task.dueDate) < today);
  const dueToday = incomplete.filter((task) => task.dueDate && dueDateTime(task.dueDate) === today);
  const upcoming = incomplete
    .filter((task) => task.dueDate && dueDateTime(task.dueDate) > today)
    .sort((a, b) => dueDateTime(a.dueDate!) - dueDateTime(b.dueDate!));
  const highPriorityNoDate = incomplete.filter((task) => !task.dueDate && task.priority === "high");

  const ordered = [...overdue, ...dueToday, ...upcoming, ...highPriorityNoDate];

  const seen = new Set<string>();
  const result: WeddingTask[] = [];
  for (const task of ordered) {
    if (!seen.has(task.id)) {
      seen.add(task.id);
      result.push(task);
    }
  }

  return result.slice(0, limit);
}

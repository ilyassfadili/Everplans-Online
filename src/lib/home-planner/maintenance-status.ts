import type { MaintenanceStatus, MaintenanceTask } from "@/types/home-planner";

/** A task is "due soon" within this many days of today - matches the migration's own comment. */
const DUE_SOON_WINDOW_DAYS = 7;

function toUtcDateOnly(value: string): number {
  // `due_date` is a plain `YYYY-MM-DD` (Postgres `date`, no time component) -
  // parsed as UTC midnight so day-boundary comparisons never shift with the
  // viewer's own timezone, the same reasoning `TripDay`/`Trip` dates apply
  // throughout Travel Planner.
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * "Upcoming / Due / Completed / Overdue" (Phase 1's own status model) -
 * derived from `completedAt`/`dueDate` at read time, never stored (this
 * table's own migration comment), so it can never drift out of sync with
 * the dates it summarizes. `today` is passed in (not read from `Date.now()`
 * internally) so this stays a pure function - callers pass a real "now"
 * from a Server Component render.
 */
export function calculateMaintenanceStatus(task: MaintenanceTask, today: Date): MaintenanceStatus {
  if (task.completedAt) return "completed";
  if (!task.dueDate) return "upcoming";

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueUtc = toUtcDateOnly(task.dueDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((dueUtc - todayUtc) / msPerDay);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) return "due";
  return "upcoming";
}

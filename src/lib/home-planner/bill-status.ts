import type { Bill, BillStatus } from "@/types/home-planner";

/** A bill is "due soon" within this many days of today - matches `@/lib/home-planner/maintenance-status.ts`'s own window. */
const DUE_SOON_WINDOW_DAYS = 7;

function toUtcDateOnly(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * "Upcoming / Due / Paid / Overdue" (Phase 1's own status model) - derived
 * from `paidAt`/`dueDate` at read time, never stored (this table's own
 * migration comment). Same shape as `calculateMaintenanceStatus`
 * (`@/lib/home-planner/maintenance-status`) - kept as its own small
 * function rather than a shared one, since `Bill` and `MaintenanceTask`
 * are otherwise unrelated domain types (the same "each domain keeps its
 * own" convention `@/lib/home-planner/format-currency` already follows).
 */
export function calculateBillStatus(bill: Bill, today: Date): BillStatus {
  if (bill.paidAt) return "paid";
  if (!bill.dueDate) return "upcoming";

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueUtc = toUtcDateOnly(bill.dueDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((dueUtc - todayUtc) / msPerDay);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) return "due";
  return "upcoming";
}

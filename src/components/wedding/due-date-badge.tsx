import { Badge } from "@/components/ui";
import type { WeddingPlanningStatus } from "@/types/wedding";

interface DueDateBadgeProps {
  dueDate: string | null;
  status: WeddingPlanningStatus;
  className?: string;
}

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Local midnight, not UTC - a due date is a plain calendar day with no
  // time component, so "how many days away" should match the visitor's
  // own calendar, not shift by their UTC offset.
  const due = new Date(`${dueDate}T00:00:00`);
  due.setHours(0, 0, 0, 0);

  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * The checklist's and dashboard's shared "when is this due" treatment
 * (Phase 4: clear-but-calm visual states for overdue/due-today/upcoming).
 * `warning`, never `error`, for overdue - a missed due date is a planning
 * signal to act on, not a fault to feel alarmed about.
 */
export function DueDateBadge({ dueDate, status, className }: DueDateBadgeProps) {
  // A completed task's due date isn't a live signal anymore - showing
  // "Overdue" next to a checked-off task would read as a false alarm.
  if (!dueDate || status === "completed") {
    return null;
  }

  const diff = daysUntil(dueDate);

  if (diff < 0) {
    return (
      <Badge variant="warning" className={className}>
        Overdue
      </Badge>
    );
  }
  if (diff === 0) {
    return (
      <Badge variant="warning" className={className}>
        Due today
      </Badge>
    );
  }
  if (diff === 1) {
    return (
      <Badge variant="neutral" className={className}>
        Due tomorrow
      </Badge>
    );
  }

  const due = new Date(`${dueDate}T00:00:00`);
  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <Badge variant="neutral" className={className}>
      Due {label}
    </Badge>
  );
}

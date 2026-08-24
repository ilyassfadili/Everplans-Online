import { Badge } from "@/components/ui";
import type { MaintenanceStatus } from "@/types/home-planner";

const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  completed: "Completed",
  overdue: "Overdue",
  due: "Due soon",
  upcoming: "Upcoming",
};

const STATUS_VARIANT: Record<MaintenanceStatus, "success" | "error" | "warning" | "neutral"> = {
  completed: "success",
  overdue: "error",
  due: "warning",
  upcoming: "neutral",
};

/**
 * A restrained status indicator (Phase 1: "use clear visual hierarchy and
 * restrained visual indicators") - one small badge per task, using the
 * same semantic success/warning/error tokens the rest of the design system
 * already reserves for exactly this kind of state.
 */
export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

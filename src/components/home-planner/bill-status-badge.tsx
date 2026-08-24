import { Badge } from "@/components/ui";
import type { BillStatus } from "@/types/home-planner";

const STATUS_LABEL: Record<BillStatus, string> = {
  paid: "Paid",
  overdue: "Overdue",
  due: "Due soon",
  upcoming: "Upcoming",
};

const STATUS_VARIANT: Record<BillStatus, "success" | "error" | "warning" | "neutral"> = {
  paid: "success",
  overdue: "error",
  due: "warning",
  upcoming: "neutral",
};

/** A restrained status indicator, same shape `MaintenanceStatusBadge` establishes. */
export function BillStatusBadge({ status }: { status: BillStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

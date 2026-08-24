import { Wrench } from "lucide-react";

import { Badge, Button, Card, Text } from "@/components/ui";
import { MaintenanceStatusBadge } from "@/components/home-planner/maintenance-status-badge";
import { calculateMaintenanceStatus } from "@/lib/home-planner/maintenance-status";
import type { MaintenanceTask } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface MaintenanceSummaryCardProps {
  tasks: MaintenanceTask[];
}

/**
 * A small, lightweight Maintenance summary for the Home Dashboard (Prompt
 * 3 Phase 3: "add an appropriate maintenance summary to the existing Home
 * Dashboard... keep this integration focused"). Replaces the Prompt 1
 * placeholder `UpcomingCard` now that maintenance tasks actually exist -
 * an "Upcoming" placeholder claiming nothing is tracked would no longer be
 * honest once real due dates exist to show.
 */
export function MaintenanceSummaryCard({ tasks }: MaintenanceSummaryCardProps) {
  const today = new Date();
  const withStatus = tasks
    .map((task) => ({ task, status: calculateMaintenanceStatus(task, today) }))
    .filter((item) => item.status === "overdue" || item.status === "due")
    .sort((a, b) => (a.status === "overdue" && b.status !== "overdue" ? -1 : 0));

  const overdueCount = withStatus.filter((item) => item.status === "overdue").length;
  const dueSoonCount = withStatus.filter((item) => item.status === "due").length;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Wrench}
        title="Maintenance"
        action={
          <Button href="/app/home-planner/maintenance" variant="ghost" size="sm">
            View
          </Button>
        }
      />
      <div className="mt-4 flex-1">
        {withStatus.length === 0 ? (
          <Text size="body-sm" tone="faint">
            Nothing due or overdue right now.
          </Text>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {overdueCount > 0 && <Badge variant="error">{overdueCount} overdue</Badge>}
              {dueSoonCount > 0 && <Badge variant="warning">{dueSoonCount} due soon</Badge>}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {withStatus.slice(0, 4).map(({ task, status }) => (
                <li key={task.id} className="flex items-center justify-between gap-2">
                  <Text size="body-sm" className="truncate text-ink">
                    {task.name}
                  </Text>
                  <MaintenanceStatusBadge status={status} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}

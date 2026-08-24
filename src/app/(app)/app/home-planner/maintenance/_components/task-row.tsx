"use client";

import { useTransition } from "react";
import { Check, Repeat, RotateCcw, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Link, Stack, Text } from "@/components/ui";
import { getMaintenanceCategoryLabel } from "@/components/home-planner/maintenance-category-options";
import { getMaintenancePriorityLabel } from "@/components/home-planner/maintenance-priority-options";
import { MaintenanceStatusBadge } from "@/components/home-planner/maintenance-status-badge";
import { getRecurrenceFrequencyLabel } from "@/lib/home-planner/recurrence";
import type { MaintenanceStatus, MaintenanceTask } from "@/types/home-planner";

import { completeTaskAction, deleteMaintenanceTaskAction, reopenTaskAction } from "../actions";

interface TaskRowProps {
  task: MaintenanceTask;
  status: MaintenanceStatus;
  roomName: string | null;
}

const PRIORITY_BADGE_VARIANT: Record<string, "neutral" | "warning" | "error"> = {
  low: "neutral",
  medium: "neutral",
  high: "warning",
};

/** One maintenance task, in the overview list - name links to its detail page; complete/reopen and delete are instant actions, the same shape `RoomCard` establishes for its own quick-delete. */
export function TaskRow({ task, status, roomName }: TaskRowProps) {
  const [isToggling, startToggleTransition] = useTransition();

  function handleToggleComplete() {
    startToggleTransition(() => {
      if (status === "completed") {
        void reopenTaskAction(task.id);
      } else {
        void completeTaskAction(task.id);
      }
    });
  }

  function handleDelete() {
    if (window.confirm(`Remove ${task.name}? This can't be undone.`)) {
      void deleteMaintenanceTaskAction(task.id);
    }
  }

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/app/home-planner/maintenance/${task.id}`} variant="prominent">
            {task.name}
          </Link>
          <MaintenanceStatusBadge status={status} />
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]}>{getMaintenancePriorityLabel(task.priority)}</Badge>
          {task.recurrenceFrequency && (
            <Badge variant="brand">
              <Icon icon={Repeat} size="sm" />
              {getRecurrenceFrequencyLabel(task.recurrenceFrequency)}
            </Badge>
          )}
        </div>
        <Stack direction="row" gap="3" className="mt-1 flex-wrap">
          <Text size="body-sm" tone="muted">
            {getMaintenanceCategoryLabel(task.category)}
          </Text>
          {roomName && (
            <Text size="body-sm" tone="muted">
              {roomName}
            </Text>
          )}
          {task.dueDate && (
            <Text size="body-sm" tone="muted">
              Due {task.dueDate}
            </Text>
          )}
        </Stack>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant={status === "completed" ? "outline" : "secondary"}
          size="sm"
          onClick={handleToggleComplete}
          disabled={isToggling}
          leadingIcon={<Icon icon={status === "completed" ? RotateCcw : Check} size="sm" />}
        >
          {status === "completed" ? "Reopen" : "Complete"}
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove ${task.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

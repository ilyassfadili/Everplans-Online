"use client";

import { Bell, CircleCheck } from "lucide-react";

import { Button, Card, EmptyState } from "@/components/ui";
import { TaskRow } from "@/components/wedding/task-row";
import type { WeddingPlanningStatus, WeddingTask } from "@/types/wedding";

import { setTaskStatusAction } from "../actions";
import { PanelHeader } from "./panel-header";

interface FocusPanelProps {
  tasks: WeddingTask[];
  hasAnyTasks: boolean;
}

function handleToggleStatus(taskId: string, status: WeddingPlanningStatus) {
  void setTaskStatusAction(taskId, status);
}

/**
 * "What needs your attention" - overdue, due-today, and upcoming tasks,
 * plus incomplete high-priority tasks with no date (`getTasksNeedingAttention`,
 * `@/lib/wedding/task-views`). Read + quick status toggle only, no editing
 * - the full checklist (`onSave` omitted from `TaskRow`) is where editing
 * happens.
 */
export function FocusPanel({ tasks, hasAnyTasks }: FocusPanelProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Bell}
        tone="warning"
        title="Needs your attention"
        action={
          hasAnyTasks && (
            <Button href="/app/wedding-planner/checklist" variant="outline" size="sm">
              View checklist
            </Button>
          )
        }
      />

      {tasks.length === 0 && hasAnyTasks && (
        <EmptyState
          icon={CircleCheck}
          title="All caught up"
          description="Nothing's pulling at your attention right now - a good moment to breathe."
          className="mt-4 py-10"
        />
      )}

      {tasks.length === 0 && !hasAnyTasks && (
        <EmptyState
          title="Nothing to flag yet"
          description="Once you start your checklist, anything that needs you will show up here first."
          className="mt-4 py-10"
          action={
            <Button href="/app/wedding-planner/checklist" size="sm">
              Start your checklist
            </Button>
          }
        />
      )}

      {tasks.length > 0 && (
        <ul className="mt-3 flex flex-1 flex-col divide-y divide-line-subtle">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggleStatus={handleToggleStatus} />
          ))}
        </ul>
      )}
    </Card>
  );
}

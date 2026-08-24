"use client";

import { useState } from "react";
import { ListChecks, X } from "lucide-react";

import { Button, Card, EmptyState, Heading, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { TaskRow } from "@/components/wedding/task-row";
import type { WeddingPlanningStatus, WeddingTask } from "@/types/wedding";

import { assignTaskToEventAction, createEventTaskAction, unassignTaskFromEventAction } from "../../actions";
import { setTaskStatusAction } from "../../../actions";

function handleToggleStatus(taskId: string, status: WeddingPlanningStatus) {
  void setTaskStatusAction(taskId, status);
}

interface EventTasksSectionProps {
  weddingId: string;
  eventId: string;
  eventTasks: WeddingTask[];
  unassignedTasks: WeddingTask[];
}

/**
 * The event detail page's related tasks (Prompt 5 Phase 2) - extends the
 * existing task architecture via `wedding_tasks.event_id`, reusing the
 * same `TaskRow` the dashboard and checklist already render. A task can
 * be created here directly (pre-scoped to this event) or linked from any
 * existing unassigned task - editing a task's other fields still happens
 * on the checklist, not duplicated here.
 */
export function EventTasksSection({ weddingId, eventId, eventTasks, unassignedTasks }: EventTasksSectionProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  async function handleCreate() {
    const title = newTaskTitle.trim();
    if (!title) return;

    setIsCreating(true);
    await createEventTaskAction(weddingId, eventId, title);
    setIsCreating(false);
    setNewTaskTitle("");
  }

  async function handleLinkExisting(taskId: string) {
    setIsLinking(true);
    await assignTaskToEventAction(taskId, eventId);
    setIsLinking(false);
  }

  return (
    <Card variant="standard" padding="lg">
      <Heading as="h2" size="h4">
        Tasks
      </Heading>

      {eventTasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks yet" description="Add a task below, or link one from your checklist." className="mt-4 py-10" />
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {eventTasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TaskRow task={task} onToggleStatus={handleToggleStatus} />
              </div>
              <button
                type="button"
                onClick={() => void unassignTaskFromEventAction(task.id)}
                aria-label={`Unlink "${task.title}" from this event`}
                className="-m-1.5 shrink-0 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Icon icon={X} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Text size="body-sm" weight="medium" className="text-ink">
            Add a task
          </Text>
          <Input
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="e.g. Confirm final headcount"
            maxLength={150}
          />
        </div>
        <Button type="button" loading={isCreating} onClick={handleCreate} className="sm:w-auto">
          Add task
        </Button>
      </div>

      {unassignedTasks.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <Text size="body-sm" weight="medium" className="text-ink">
            Or link an existing task
          </Text>
          <Select
            aria-label="Link an existing task"
            placeholder="Choose a task"
            options={unassignedTasks.map((task) => ({ value: task.id, label: task.title }))}
            onValueChange={handleLinkExisting}
            disabled={isLinking}
          />
        </div>
      )}
    </Card>
  );
}

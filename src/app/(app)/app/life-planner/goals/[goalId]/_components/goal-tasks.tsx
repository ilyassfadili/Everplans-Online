"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { Icon, Link, Text } from "@/components/ui";
import type { LifeTask } from "@/types/life-planner";

import { completeTaskAction, reopenTaskAction } from "../../../tasks/actions";
import { formatTaskDate, isTaskOverdue } from "../../../tasks/_components/task-visuals";

interface GoalTasksProps {
  tasks: LifeTask[];
}

/**
 * The goal detail page's own compact "Tasks for this goal" section (Life
 * Planner Prompt 3 Phase 1 §5) - a plain list with a completion toggle per
 * row, deliberately not the full Tasks list's own row (`TaskRow`, with its
 * own edit/archive icon buttons) - editing or archiving a task still
 * happens on its own detail page (linked per row), the same "link out to
 * the real detail page rather than edit inline" role `GoalCard` plays for
 * goals one page up. No inline "add task" form here either - "Manage
 * tasks" links to the real Tasks list, which already has one.
 */
export function GoalTasks({ tasks }: GoalTasksProps) {
  return (
    <div className="flex flex-col gap-3">
      {tasks.length === 0 ? (
        <Text size="body-sm" tone="muted">
          No tasks linked to this goal yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <GoalTaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      <Link href="/app/life-planner/tasks" variant="subtle" className="self-start text-body-sm">
        Manage tasks →
      </Link>
    </div>
  );
}

function GoalTaskRow({ task }: { task: LifeTask }) {
  const [isToggling, setIsToggling] = useState(false);
  const isCompleted = task.status === "completed";
  const overdue = isTaskOverdue(task);
  const dueDateLabel = formatTaskDate(task.dueDate);

  async function handleToggle() {
    setIsToggling(true);
    await (isCompleted ? reopenTaskAction(task.id) : completeTaskAction(task.id));
    setIsToggling(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface p-3">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={isToggling}
          aria-label={isCompleted ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
          className="shrink-0 disabled:opacity-60"
        >
          <Icon icon={isCompleted ? CheckCircle2 : Circle} size="sm" className={isCompleted ? "text-success" : "text-ink-faint"} />
        </button>
        <Link
          href={`/app/life-planner/tasks/${task.id}`}
          variant="inline"
          className={`truncate text-body-sm font-medium no-underline hover:underline ${isCompleted ? "text-ink-muted line-through" : "text-ink"}`}
        >
          {task.title}
        </Link>
      </div>
      {dueDateLabel && (
        <Text size="body-sm" className={overdue ? "shrink-0 text-error" : "shrink-0 text-ink-faint"}>
          {dueDateLabel}
        </Text>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Archive, CheckCircle2, Circle, PencilLine, type LucideIcon } from "lucide-react";

import { Badge, Icon, Link, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { LifeTask } from "@/types/life-planner";

import { archiveTaskAction, completeTaskAction, reopenTaskAction } from "../actions";
import { formatTaskDate, isTaskOverdue, PRIORITY_BADGE, PRIORITY_LABEL } from "./task-visuals";

const iconButtonClass =
  "-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface TaskRowProps {
  task: LifeTask;
  areaName: string | null;
  areaIcon: LucideIcon | null;
  goalTitle: string | null;
}

/**
 * One Life Task row for the full Tasks list (Phase 1 §4) - a completion
 * toggle, title, due date (overdue treatment via `isTaskOverdue`), priority
 * badge, Life Area chip, and a linked goal title if any, plus edit (to the
 * detail page) and archive affordances. Same "plain row, no modal" register
 * `MilestoneRow` (`@/app/(app)/app/life-planner/goals/[goalId]/_components/goal-milestones`)
 * already establishes for a comparable checkable list item.
 */
export function TaskRow({ task, areaName, areaIcon: AreaIcon, goalTitle }: TaskRowProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = task.status === "completed";
  const overdue = isTaskOverdue(task);
  const dueDateLabel = formatTaskDate(task.dueDate);

  async function handleToggle() {
    setIsToggling(true);
    const result = isCompleted ? await reopenTaskAction(task.id) : await completeTaskAction(task.id);
    setIsToggling(false);
    setError(result.status === "success" ? null : (result.message ?? "Couldn't update that task."));
  }

  async function handleArchive() {
    if (!window.confirm(`Archive "${task.title}"? You can still find it later, but it'll leave this list.`)) return;
    setIsArchiving(true);
    const result = await archiveTaskAction(task.id);
    setIsArchiving(false);
    if (result.status !== "success") setError(result.message ?? "Couldn't archive that task.");
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line-subtle bg-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <button
            type="button"
            onClick={() => void handleToggle()}
            disabled={isToggling}
            aria-label={isCompleted ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
            className="mt-0.5 shrink-0 disabled:opacity-60"
          >
            <Icon icon={isCompleted ? CheckCircle2 : Circle} size="sm" className={isCompleted ? "text-success" : "text-ink-faint"} />
          </button>

          <div className="flex min-w-0 flex-col gap-1">
            <Link href={`/app/life-planner/tasks/${task.id}`} variant="inline" className="min-w-0 text-ink no-underline hover:text-ink">
              <Text as="p" weight="medium" className={isCompleted ? "text-ink-muted line-through" : "text-ink"}>
                {task.title}
              </Text>
            </Link>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {dueDateLabel && (
                <Text size="body-sm" className={overdue ? "text-error" : "text-ink-faint"}>
                  {overdue ? "Overdue · " : "Due "}
                  {dueDateLabel}
                </Text>
              )}
              <Badge variant={PRIORITY_BADGE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
              {areaName && (
                <div className="flex items-center gap-1 text-ink-muted">
                  {AreaIcon && <Icon icon={AreaIcon} size="sm" />}
                  <Text size="body-sm" tone="muted">
                    {areaName}
                  </Text>
                </div>
              )}
              {goalTitle && (
                <Text size="body-sm" tone="faint">
                  {goalTitle}
                </Text>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Link href={`/app/life-planner/tasks/${task.id}`} variant="subtle" aria-label={`Edit "${task.title}"`} className={cn(iconButtonClass, "no-underline")}>
            <Icon icon={PencilLine} size="sm" />
          </Link>
          <button type="button" onClick={() => void handleArchive()} disabled={isArchiving} aria-label={`Archive "${task.title}"`} className={iconButtonClass}>
            <Icon icon={Archive} size="sm" />
          </button>
        </div>
      </div>

      {error && (
        <Text size="body-sm" tone="error" className="pl-7">
          {error}
        </Text>
      )}
    </div>
  );
}

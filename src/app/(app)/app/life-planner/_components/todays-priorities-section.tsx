"use client";

import { useState } from "react";
import { ArrowRight, Circle } from "lucide-react";

import { Button, Card, EmptyState, Heading, Icon, Link, Text } from "@/components/ui";
import type { LifeTask } from "@/types/life-planner";

import { completeTaskAction } from "../tasks/actions";
import { formatTaskDate, isTaskOverdue } from "../tasks/_components/task-visuals";

interface TodaysPrioritiesSectionProps {
  tasks: LifeTask[];
}

/**
 * The dashboard's own "Today's priorities" section (Phase 1 §6) - the real
 * system that replaces the "Priorities" tile `FutureModulesSection` used to
 * render as a placeholder. Up to 5 non-archived, not-yet-completed tasks due
 * today or overdue (`getTodaysPrioritiesForCurrentUser`,
 * `@/lib/life-planner/life-tasks`), soonest-due first, each with a
 * completion toggle - a glanceable, actionable summary, not a second place
 * to edit tasks (the same "preview, not editor" role `GoalsSection` plays
 * for Life Goals). A calm, non-celebratory empty state ("Nothing urgent
 * right now") when there's nothing due - the absence of urgent tasks isn't
 * an achievement to congratulate, just a quiet fact.
 */
export function TodaysPrioritiesSection({ tasks }: TodaysPrioritiesSectionProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Today&rsquo;s priorities
        </Heading>
        <Link href="/app/life-planner/tasks" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
          View all tasks
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Nothing urgent right now"
          description="Tasks due today or overdue will show up here."
          action={
            <Button href="/app/life-planner/tasks" size="sm" variant="outline">
              Add a task
            </Button>
          }
          className="mt-4 py-6"
        />
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {tasks.map((task) => (
            <PriorityRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </Card>
  );
}

function PriorityRow({ task }: { task: LifeTask }) {
  const [isToggling, setIsToggling] = useState(false);
  const overdue = isTaskOverdue(task);
  const dueDateLabel = formatTaskDate(task.dueDate);

  async function handleComplete() {
    setIsToggling(true);
    await completeTaskAction(task.id);
    // No need to reset `isToggling` on success - `completeTaskAction`
    // revalidates this section's own data, and a completed task no longer
    // matches `getTodaysPrioritiesForCurrentUser`'s own filter, so this row
    // simply disappears from the next render.
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface p-3">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void handleComplete()}
          disabled={isToggling}
          aria-label={`Mark "${task.title}" done`}
          className="shrink-0 disabled:opacity-60"
        >
          <Icon icon={Circle} size="sm" className="text-ink-faint" />
        </button>
        <Link
          href={`/app/life-planner/tasks/${task.id}`}
          variant="inline"
          className="truncate text-body-sm font-medium text-ink no-underline hover:underline"
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

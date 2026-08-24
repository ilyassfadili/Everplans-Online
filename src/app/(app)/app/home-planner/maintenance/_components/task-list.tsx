"use client";

import { useMemo, useState } from "react";
import { Wrench } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MaintenanceStatus, MaintenanceTask } from "@/types/home-planner";

import { TaskRow } from "./task-row";

export interface TaskWithStatus {
  task: MaintenanceTask;
  status: MaintenanceStatus;
  roomName: string | null;
}

interface TaskListProps {
  items: TaskWithStatus[];
}

type StatusFilter = "all" | MaintenanceStatus | "recurring";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "due", label: "Due soon" },
  { value: "upcoming", label: "Upcoming" },
  { value: "recurring", label: "Recurring" },
  { value: "completed", label: "Completed" },
];

/**
 * The maintenance task list - status filter tabs (Phase 1: "quickly
 * understand what needs attention, what is due soon, what is overdue, and
 * what has been completed"), the same client-side filter pattern
 * `GuestList` (Wedding Planner) establishes for its own RSVP filter.
 */
export function TaskList({ items }: TaskListProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "recurring") return items.filter((item) => item.task.recurrenceFrequency !== null);
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="Add your first maintenance task"
        description="Start tracking what needs attention around your home - add a task above."
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex flex-wrap gap-1 rounded-md border border-line-subtle bg-surface-muted p-1" role="group" aria-label="Filter tasks by status">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={cn(
              "h-9 rounded-sm px-4 text-body-sm font-medium transition-colors duration-150 ease-standard",
              filter === option.value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks match this filter" description="Try a different filter to see more of your list." className="py-14" />
      ) : (
        <Card variant="standard" padding="lg">
          <ul className="flex flex-col divide-y divide-line-subtle">
            {filtered.map(({ task, status, roomName }) => (
              <TaskRow key={task.id} task={task} status={status} roomName={roomName} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

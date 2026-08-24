"use client";

import { useMemo, useState } from "react";
import { ListChecks } from "lucide-react";

import { Card, EmptyState, Heading, Text } from "@/components/ui";
import { TaskRow } from "@/components/wedding/task-row";
import type { WeddingMilestone, WeddingPlanningStatus, WeddingTask } from "@/types/wedding";

import { editTaskAction, setTaskStatusAction } from "../../actions";
import { TaskFilters, type TaskSortOption, type TaskStatusFilter } from "./task-filters";

const PRIORITY_RANK: Record<WeddingTask["priority"], number> = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: WeddingTask[], sortBy: TaskSortOption): WeddingTask[] {
  const sorted = [...tasks];

  if (sortBy === "priority") {
    sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  } else if (sortBy === "due-date") {
    sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } else {
    sorted.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return sorted;
}

interface TaskGroup {
  key: string;
  title: string;
  tasks: WeddingTask[];
}

function groupByMilestone(tasks: WeddingTask[], milestones: WeddingMilestone[]): TaskGroup[] {
  const milestoneById = new Map(milestones.map((milestone) => [milestone.id, milestone]));
  const groups = new Map<string, TaskGroup>();

  for (const task of tasks) {
    const milestone = task.milestoneId ? milestoneById.get(task.milestoneId) : undefined;
    const key = milestone ? milestone.id : "unassigned";
    const title = milestone ? milestone.title : "Other tasks";

    if (!groups.has(key)) {
      groups.set(key, { key, title, tasks: [] });
    }
    groups.get(key)!.tasks.push(task);
  }

  // Milestone groups first, in the wedding's own milestone order, then
  // "Other tasks" last - matches the order milestones already appear in
  // on the dashboard, rather than an incidental grouping order.
  const ordered: TaskGroup[] = [];
  for (const milestone of milestones) {
    const group = groups.get(milestone.id);
    if (group) ordered.push(group);
  }
  const unassigned = groups.get("unassigned");
  if (unassigned) ordered.push(unassigned);

  return ordered;
}

interface ChecklistViewProps {
  tasks: WeddingTask[];
  milestones: WeddingMilestone[];
}

/**
 * The checklist's own filter/sort/group state (Phase 3 + Phase 4) -
 * client-side over the full task list the server already fetched, since
 * this wedding's task count is small enough that refetching per filter
 * change would only add latency without any real benefit.
 */
export function ChecklistView({ tasks, milestones }: ChecklistViewProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [sortBy, setSortBy] = useState<TaskSortOption>("manual");

  const filtered = useMemo(() => {
    if (statusFilter === "active") return tasks.filter((task) => task.status !== "completed");
    if (statusFilter === "completed") return tasks.filter((task) => task.status === "completed");
    return tasks;
  }, [tasks, statusFilter]);

  const sorted = useMemo(() => sortTasks(filtered, sortBy), [filtered, sortBy]);
  const groups = useMemo(() => groupByMilestone(sorted, milestones), [sorted, milestones]);

  function handleToggleStatus(taskId: string, status: WeddingPlanningStatus) {
    void setTaskStatusAction(taskId, status);
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Your story starts here"
        description="Add your first task above, and we'll help you take it from there."
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TaskFilters statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} sortBy={sortBy} onSortByChange={setSortBy} />

      {sorted.length === 0 ? (
        <EmptyState title="No tasks match this filter" description="Try a different filter to see more of your checklist." className="py-14" />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <Card key={group.key} variant="standard" padding="lg">
              <Heading as="h2" size="h4">
                {group.title}
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-1">
                {group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}
              </Text>
              <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggleStatus={handleToggleStatus} onSave={editTaskAction} />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

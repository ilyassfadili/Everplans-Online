"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Card, DatePicker, FormField, Heading, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea, LifeGoal, LifeTask } from "@/types/life-planner";

import { archiveTaskAction, updateTaskAction } from "../../actions";
import { GoalAreaSelect, normalizeAreaId } from "../../../goals/_components/goal-area-select";
import { NO_GOAL_VALUE, TaskGoalSelect, normalizeGoalId } from "../../_components/task-goal-select";
import { formatTaskDate, isTaskOverdue, PRIORITY_BADGE, PRIORITY_LABEL, PRIORITY_OPTIONS, STATUS_BADGE, STATUS_LABEL, STATUS_OPTIONS } from "../../_components/task-visuals";

interface TaskDetailViewProps {
  task: LifeTask;
  areas: LifeArea[];
  goals: LifeGoal[];
}

/**
 * The task detail page's own content (Phase 1 §4) - a single view/edit-in-
 * place card (title/description/Life Area/goal/due date/priority/status),
 * the same "swap the card's own content, no separate route or modal"
 * toggle `GoalDetailView` already uses. Archive (not a hard delete) is this
 * page's own "remove" affordance, matching `life_tasks.is_archived`'s role
 * as the tasks UI's primary "delete" path (Phase 1 §3).
 */
export function TaskDetailView({ task, areas, goals }: TaskDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const title = formData.get("title");
    const description = formData.get("description");
    const lifeAreaId = formData.get("lifeAreaId");
    const goalId = formData.get("goalId");
    const dueDate = formData.get("dueDate");
    const priority = formData.get("priority");
    const status = formData.get("status");

    setIsSaving(true);
    const result = await updateTaskAction(task.id, {
      title: typeof title === "string" ? title : undefined,
      description: typeof description === "string" ? description : "",
      lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : "",
      goalId: typeof goalId === "string" ? normalizeGoalId(goalId) : "",
      dueDate: typeof dueDate === "string" ? dueDate : "",
      priority: typeof priority === "string" ? (priority as LifeTask["priority"]) : undefined,
      status: typeof status === "string" ? (status as LifeTask["status"]) : undefined,
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  async function handleArchive() {
    if (!window.confirm(`Archive "${task.title}"? You can still find it later, but it'll leave your active lists.`)) {
      return;
    }
    setIsArchiving(true);
    const result = await archiveTaskAction(task.id);
    setIsArchiving(false);
    if (result.status === "success") {
      router.push("/app/life-planner/tasks");
    } else {
      setError(result.message ?? "Couldn't archive that task.");
    }
  }

  const dueDateLabel = formatTaskDate(task.dueDate);
  const overdue = isTaskOverdue(task);
  const goal = task.goalId ? (goals.find((candidate) => candidate.id === task.goalId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <Card variant="standard" padding="lg">
        {isEditing ? (
          <form action={handleSave} className="flex flex-col gap-4">
            {error && (
              <Alert variant="error" title="Couldn't save that change">
                {error}
              </Alert>
            )}

            <FormField label="Title">
              <Input name="title" defaultValue={task.title} maxLength={140} required />
            </FormField>

            <FormField label="Description">
              <Textarea name="description" rows={3} maxLength={1000} defaultValue={task.description ?? ""} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Life Area">
                <GoalAreaSelect areas={areas} defaultValue={task.lifeAreaId ?? undefined} />
              </FormField>
              <FormField label="Goal">
                <TaskGoalSelect goals={goals} defaultValue={task.goalId ?? NO_GOAL_VALUE} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Due date">
                <DatePicker name="dueDate" defaultValue={task.dueDate ?? ""} aria-label="Due date" />
              </FormField>
              <FormField label="Priority">
                <Select name="priority" defaultValue={task.priority} options={PRIORITY_OPTIONS} aria-label="Priority" />
              </FormField>
            </div>

            <FormField label="Status">
              <Select name="status" defaultValue={task.status} options={STATUS_OPTIONS} aria-label="Status" />
            </FormField>

            <div className="flex items-center gap-3">
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Heading as="h1" size="h3" className={task.status === "completed" ? "text-ink-muted line-through" : undefined}>
                  {task.title}
                </Heading>
                {goal && (
                  <Text size="body-sm" tone="muted" className="mt-1.5">
                    Linked to {goal.title}
                  </Text>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={STATUS_BADGE[task.status]}>{STATUS_LABEL[task.status]}</Badge>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-subtle pt-4">
              <Badge variant={PRIORITY_BADGE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
              {dueDateLabel && (
                <Text size="body-sm" className={overdue ? "text-error" : "text-ink-muted"}>
                  {overdue ? "Overdue · " : "Due "}
                  {dueDateLabel}
                </Text>
              )}
            </div>

            {task.description && (
              <Text size="body-sm" tone="muted" className="mt-4 border-t border-line-subtle pt-4">
                {task.description}
              </Text>
            )}

            {error && (
              <Text size="body-sm" tone="error" className="mt-4">
                {error}
              </Text>
            )}
          </>
        )}
      </Card>

      <Button variant="ghost" size="sm" className="self-start text-error hover:text-error" onClick={() => void handleArchive()} disabled={isArchiving}>
        Archive task
      </Button>
    </div>
  );
}

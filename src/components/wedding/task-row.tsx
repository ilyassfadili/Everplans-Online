"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";

import { Button, Checkbox, DatePicker, Icon, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { TaskMutationResult, UpdateTaskInput } from "@/lib/wedding/tasks";
import type { WeddingPlanningStatus, WeddingTask } from "@/types/wedding";

import { DueDateBadge } from "./due-date-badge";
import { PriorityBadge } from "./priority-badge";
import { PrioritySelect } from "./priority-select";

interface TaskRowProps {
  task: WeddingTask;
  onToggleStatus: (taskId: string, status: WeddingPlanningStatus) => void;
  /** Present only where editing makes sense (the full checklist) - the dashboard's preview rows are read + toggle only. */
  onSave?: (taskId: string, input: UpdateTaskInput) => Promise<TaskMutationResult>;
  className?: string;
}

/**
 * One task, shared verbatim between the checklist and the dashboard's
 * "needs attention"/upcoming previews - one consistent row treatment
 * everywhere a task appears, per Phase 3's "avoid giant dense tables"
 * instruction (a scannable row, not a table).
 *
 * The checkbox is the fast, obvious status control (Phase 3: "make
 * changing status fast and obvious") - checking always completes a task,
 * unchecking reopens it to "not started". The finer `"in-progress"` state
 * exists for a task someone has started but not finished, and is set
 * through the edit form (`onSave`) rather than a second checkbox state,
 * keeping the primary interaction binary and instant.
 */
export function TaskRow({ task, onToggleStatus, onSave, className }: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, startToggleTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDone = task.status === "completed";

  function handleToggle() {
    startToggleTransition(() => {
      onToggleStatus(task.id, isDone ? "not-started" : "completed");
    });
  }

  async function handleSave(formData: FormData) {
    if (!onSave) return;

    const title = formData.get("title");
    const priority = formData.get("priority");
    const dueDate = formData.get("dueDate");

    const input: UpdateTaskInput = {
      title: typeof title === "string" ? title : undefined,
      priority: priority === "low" || priority === "medium" || priority === "high" ? priority : undefined,
      dueDate: typeof dueDate === "string" ? dueDate : "",
    };

    setIsSaving(true);
    const result = await onSave(task.id, input);
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  if (isEditing) {
    return (
      <li className={className}>
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <Input name="title" defaultValue={task.title} maxLength={150} aria-label="Task title" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <PrioritySelect name="priority" defaultValue={task.priority} aria-label="Priority" />
            <DatePicker name="dueDate" defaultValue={task.dueDate ?? ""} aria-label="Due date" />
          </div>
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors duration-150 ease-standard hover:bg-surface-muted/60 ${className ?? ""}`}
    >
      <Checkbox
        checked={isDone}
        onChange={handleToggle}
        disabled={isToggling}
        aria-label={isDone ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <Text size="body" weight="medium" className={isDone ? "text-ink-faint line-through" : "text-ink"}>
          {task.title}
        </Text>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          <DueDateBadge dueDate={task.dueDate} status={task.status} />
        </div>
      </div>
      {onSave && (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          aria-label={`Edit "${task.title}"`}
        >
          <Icon icon={Pencil} size="sm" />
        </button>
      )}
    </li>
  );
}

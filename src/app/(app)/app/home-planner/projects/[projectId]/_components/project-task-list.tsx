"use client";

import { useActionState, useTransition } from "react";
import { Check, ListTodo, Trash2 } from "lucide-react";

import { Alert, Button, Card, EmptyState, Icon, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { cn } from "@/lib/cn";
import type { ProjectTask } from "@/types/home-planner";

import { createProjectTaskFormAction, removeProjectTaskAction, toggleProjectTaskAction, type CreateProjectTaskFormState } from "../../actions";

interface ProjectTaskListProps {
  projectId: string;
  tasks: ProjectTask[];
}

const initialState: CreateProjectTaskFormState = { status: "idle" };

function TaskRow({ task }: { task: ProjectTask }) {
  const [isToggling, startToggleTransition] = useTransition();

  function handleToggle() {
    startToggleTransition(() => {
      void toggleProjectTaskAction(task.id, !task.isCompleted);
    });
  }

  function handleDelete() {
    void removeProjectTaskAction(task.id);
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <button type="button" onClick={handleToggle} disabled={isToggling} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full",
            task.isCompleted ? "bg-brand text-ink-on-brand" : "bg-surface-muted ring-1 ring-inset ring-line",
          )}
        >
          {task.isCompleted && <Check className="size-3" strokeWidth={2.5} />}
        </span>
        <Text
          size="body-sm"
          tone={task.isCompleted ? "muted" : "default"}
          className={cn("truncate", task.isCompleted && "line-through decoration-line")}
        >
          {task.name}
        </Text>
        {task.dueDate && (
          <Text size="body-sm" tone="faint" className="shrink-0">
            {task.dueDate}
          </Text>
        )}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Remove ${task.name}`}
        className="-m-1.5 shrink-0 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Icon icon={Trash2} size="sm" />
      </button>
    </li>
  );
}

/** A project's task checklist - add, toggle complete, remove, all instant. Progress on the project card/detail header is derived from these, never a separate manually-set number. */
export function ProjectTaskList({ projectId, tasks }: ProjectTaskListProps) {
  const action = createProjectTaskFormAction.bind(null, projectId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center gap-2.5">
        <Icon icon={ListTodo} size="sm" className="text-ink-faint" />
        <Text size="body" weight="medium" className="text-ink">
          Tasks
        </Text>
      </div>

      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that task" className="mt-3">
          {state.message}
        </Alert>
      )}

      <form action={formAction} className="mt-3 flex gap-2">
        <Input name="name" placeholder="Add a task" maxLength={150} aria-label="Task name" required className="flex-1" />
        <Button type="submit" size="sm" loading={isCreating}>
          Add
        </Button>
      </form>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Break this project down into steps above." className="mt-4 py-8" />
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-line-subtle">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </Card>
  );
}

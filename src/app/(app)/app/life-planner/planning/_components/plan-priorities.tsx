"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Circle, CircleCheck, Trash2 } from "lucide-react";

import { Alert, Button, FormField, Icon, Input, Select, Text } from "@/components/ui";
import type { LifeGoal, LifePlanPrioritySourceType, LifeTask } from "@/types/life-planner";
import { cn } from "@/lib/cn";

const iconButtonClass =
  "-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * The minimal shape `PlanPriorities` actually needs from a priority row -
 * both `LifeWeeklyPriority` and `LifeMonthlyPriority`
 * (`@/types/life-planner`) satisfy this structurally, which is what lets
 * one shared component back both the Weekly and Monthly Planning pages
 * without needing a period-type discriminant threaded through it.
 */
export interface PlanPriorityItem {
  id: string;
  title: string;
  sourceType: LifePlanPrioritySourceType;
  isDone: boolean;
}

export interface AddPriorityFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

const initialAddState: AddPriorityFormState = { status: "idle" };

type PriorityActionResult = { status: "success" } | { status: "error" | "invalid"; message?: string };

interface PlanPrioritiesProps {
  priorities: PlanPriorityItem[];
  /** Active goals eligible to be promoted into a priority via the "Add from" select. */
  goals: LifeGoal[];
  /** Not-yet-completed tasks eligible to be promoted into a priority via the "Add from" select. */
  tasks: LifeTask[];
  emptyLabel: string;
  addFormAction: (prevState: AddPriorityFormState, formData: FormData) => Promise<AddPriorityFormState>;
  onToggle: (id: string) => Promise<PriorityActionResult>;
  onDelete: (id: string) => Promise<PriorityActionResult>;
  onMove: (id: string, direction: "up" | "down") => Promise<PriorityActionResult>;
}

const CUSTOM_VALUE = "custom";

/**
 * The Weekly/Monthly Planning pages' own "This period's priorities"
 * section (Phase 1 §4-5) - add-from-scratch or add-from-an-existing-goal/
 * task, toggle done, reorder, delete. Period-agnostic (see
 * `PlanPriorityItem`'s own comment): the weekly page passes
 * `LifeWeeklyPriority[]` plus its own bound Server Actions, the monthly
 * page passes `LifeMonthlyPriority[]` plus its own, and this component
 * never needs to know which.
 */
export function PlanPriorities({ priorities, goals, tasks, emptyLabel, addFormAction, onToggle, onDelete, onMove }: PlanPrioritiesProps) {
  const [formState, formAction, isAdding] = useActionState(addFormAction, initialAddState);
  const [source, setSource] = useState(CUSTOM_VALUE);
  const [title, setTitle] = useState("");
  const wasAddingRef = useRef(false);

  // Clears the form after a successful add (this action's own convention
  // returns `{ status: "idle" }` on success, the same as
  // `addRoutineItemFormAction`) - but leaves it alone after a failed one, so
  // the user doesn't lose what they typed while fixing a validation error.
  useEffect(() => {
    if (wasAddingRef.current && !isAdding && formState.status === "idle") {
      setTitle("");
      setSource(CUSTOM_VALUE);
    }
    wasAddingRef.current = isAdding;
  }, [isAdding, formState]);

  const sourceOptions = [
    { value: CUSTOM_VALUE, label: "Write your own" },
    ...goals.map((goal) => ({ value: `goal:${goal.id}`, label: `Goal - ${goal.title}` })),
    ...tasks.map((task) => ({ value: `task:${task.id}`, label: `Task - ${task.title}` })),
  ];

  function handleSourceChange(value: string) {
    setSource(value);
    if (value === CUSTOM_VALUE) return;
    const [kind, id] = value.split(":");
    const match = kind === "goal" ? goals.find((goal) => goal.id === id) : tasks.find((task) => task.id === id);
    if (match) setTitle(match.title);
  }

  const [sourceType, sourceId] = source === CUSTOM_VALUE ? [CUSTOM_VALUE, ""] : source.split(":", 2);

  return (
    <div className="flex flex-col gap-3">
      {priorities.length === 0 ? (
        <Text size="body-sm" tone="muted">
          {emptyLabel}
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {priorities.map((priority, index) => (
            <PriorityRow
              key={priority.id}
              priority={priority}
              isFirst={index === 0}
              isLast={index === priorities.length - 1}
              onToggle={onToggle}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-muted/40 p-4">
        {formState.status !== "idle" && (
          <Alert variant="error" title="Couldn't add that priority">
            {formState.message}
          </Alert>
        )}

        {(goals.length > 0 || tasks.length > 0) && (
          <FormField label="Add from">
            <Select options={sourceOptions} value={source} onValueChange={handleSourceChange} aria-label="Add from" />
          </FormField>
        )}

        <FormField label="Priority">
          <Input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Finish the Q3 report"
            maxLength={140}
            required
          />
        </FormField>

        <input type="hidden" name="sourceType" value={sourceType} />
        <input type="hidden" name="sourceId" value={sourceId ?? ""} />

        <Button type="submit" size="sm" loading={isAdding} className="self-start">
          Add priority
        </Button>
      </form>
    </div>
  );
}

interface PriorityRowProps {
  priority: PlanPriorityItem;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (id: string) => Promise<PriorityActionResult>;
  onDelete: (id: string) => Promise<PriorityActionResult>;
  onMove: (id: string, direction: "up" | "down") => Promise<PriorityActionResult>;
}

function PriorityRow({ priority, isFirst, isLast, onToggle, onDelete, onMove }: PriorityRowProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setIsToggling(true);
    const result = await onToggle(priority.id);
    setIsToggling(false);
    setError(result.status === "success" ? null : (result.message ?? "Couldn't update that priority."));
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${priority.title}"? This can't be undone.`)) return;
    setIsDeleting(true);
    const result = await onDelete(priority.id);
    setIsDeleting(false);
    if (result.status !== "success") setError(result.message ?? "Couldn't remove that priority.");
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line-subtle bg-surface p-3.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={isToggling}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-60"
          aria-label={`Mark "${priority.title}" ${priority.isDone ? "not done" : "done"}`}
        >
          <Icon icon={priority.isDone ? CircleCheck : Circle} size="sm" className={priority.isDone ? "shrink-0 text-success" : "shrink-0 text-ink-faint"} />
          <span className={cn("truncate text-body-sm font-medium", priority.isDone ? "text-ink-faint line-through" : "text-ink")}>{priority.title}</span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => void onMove(priority.id, "up")}
            disabled={isFirst}
            aria-label={`Move "${priority.title}" earlier`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronUp} size="sm" />
          </button>
          <button
            type="button"
            onClick={() => void onMove(priority.id, "down")}
            disabled={isLast}
            aria-label={`Move "${priority.title}" later`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronDown} size="sm" />
          </button>
          <button type="button" onClick={() => void handleDelete()} disabled={isDeleting} aria-label={`Remove "${priority.title}"`} className={iconButtonClass}>
            <Icon icon={Trash2} size="sm" />
          </button>
        </div>
      </div>

      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}
    </div>
  );
}

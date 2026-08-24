"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { Alert, Button, Checkbox, FormField, Icon, Input, Select, Text } from "@/components/ui";
import type { LifeGoalActionStep, LifeGoalMilestone } from "@/types/life-planner";

import {
  createActionStepFormAction,
  deleteActionStepAction,
  moveActionStepAction,
  toggleActionStepAction,
  type CreateActionStepFormState,
} from "../actions";

const initialState: CreateActionStepFormState = { status: "idle" };

/** Sentinel for "no milestone" - Radix's `Select.Item` can't take a genuinely empty `value` (same constraint `GoalAreaSelect`'s own `NO_AREA_VALUE` works around). */
const NO_MILESTONE_VALUE = "none";

const iconButtonClass =
  "-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface GoalActionStepsProps {
  goalId: string;
  milestones: LifeGoalMilestone[];
  actionSteps: LifeGoalActionStep[];
}

interface StepGroup {
  milestoneId: string | null;
  milestoneTitle: string | null;
  steps: LifeGoalActionStep[];
}

/**
 * The goal detail page's own "Action steps" section (Phase 3) - grouped by
 * `milestoneId`, with an "Unassigned" group first for steps filed under no
 * milestone, then one group per milestone in that milestone's own
 * `position` order. A goal with no milestones at all renders as a single
 * implicit "Unassigned" group with no visible heading - no point labeling
 * the one group that exists.
 */
export function GoalActionSteps({ goalId, milestones, actionSteps }: GoalActionStepsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createActionStepFormAction.bind(null, goalId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  const milestoneOptions = [{ value: NO_MILESTONE_VALUE, label: "No milestone" }, ...milestones.map((milestone) => ({ value: milestone.id, label: milestone.title }))];

  const groups: StepGroup[] = [
    { milestoneId: null, milestoneTitle: null, steps: actionSteps.filter((step) => step.milestoneId === null) },
    ...milestones.map((milestone) => ({
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      steps: actionSteps.filter((step) => step.milestoneId === milestone.id),
    })),
  ].filter((group) => group.steps.length > 0 || (group.milestoneId === null && milestones.length === 0));

  return (
    <div className="flex flex-col gap-4">
      {actionSteps.length === 0 ? (
        <Text size="body-sm" tone="muted">
          No action steps yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.milestoneId ?? "unassigned"} className="flex flex-col gap-2">
              {group.milestoneTitle && (
                <Text size="body-sm" weight="medium" tone="muted" className="uppercase tracking-wide">
                  {group.milestoneTitle}
                </Text>
              )}
              {milestones.length > 0 && !group.milestoneTitle && (
                <Text size="body-sm" weight="medium" tone="faint" className="uppercase tracking-wide">
                  Unassigned
                </Text>
              )}
              <div className="flex flex-col gap-2">
                {group.steps.map((step, index) => (
                  <ActionStepRow key={step.id} goalId={goalId} step={step} isFirst={index === 0} isLast={index === group.steps.length - 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-muted/40 p-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that step">
              {formState.message}
            </Alert>
          )}

          <FormField label="Title">
            <Input name="title" placeholder="e.g. Book the venue tour" maxLength={160} required />
          </FormField>

          {milestones.length > 0 && (
            <FormField label="Milestone" hint="Optional - file this under one of your milestones.">
              <Select name="milestoneId" defaultValue={NO_MILESTONE_VALUE} options={milestoneOptions} aria-label="Milestone" />
            </FormField>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add step
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} disabled={isCreating}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setIsAdding(true)}>
          Add action step
        </Button>
      )}
    </div>
  );
}

interface ActionStepRowProps {
  goalId: string;
  step: LifeGoalActionStep;
  isFirst: boolean;
  isLast: boolean;
}

function ActionStepRow({ goalId, step, isFirst, isLast }: ActionStepRowProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setIsToggling(true);
    const result = await toggleActionStepAction(goalId, step.id);
    setIsToggling(false);
    setError(result.status === "success" ? null : (result.message ?? "Couldn't update that step."));
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${step.title}"? This can't be undone.`)) return;
    setIsDeleting(true);
    const result = await deleteActionStepAction(goalId, step.id);
    setIsDeleting(false);
    if (result.status !== "success") setError(result.message ?? "Couldn't remove that step.");
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line-subtle bg-surface px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <label className="flex min-w-0 items-center gap-2.5">
          <Checkbox checked={step.isCompleted} disabled={isToggling} onChange={() => void handleToggle()} aria-label={`Mark "${step.title}" ${step.isCompleted ? "not completed" : "completed"}`} />
          <span className={`truncate text-body-sm ${step.isCompleted ? "text-ink-muted line-through" : "text-ink"}`}>{step.title}</span>
        </label>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => void moveActionStepAction(goalId, step.id, "up")}
            disabled={isFirst}
            aria-label={`Move "${step.title}" earlier`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronUp} size="sm" />
          </button>
          <button
            type="button"
            onClick={() => void moveActionStepAction(goalId, step.id, "down")}
            disabled={isLast}
            aria-label={`Move "${step.title}" later`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronDown} size="sm" />
          </button>
          <button type="button" onClick={() => void handleDelete()} disabled={isDeleting} aria-label={`Remove "${step.title}"`} className={iconButtonClass}>
            <Icon icon={Trash2} size="sm" />
          </button>
        </div>
      </div>

      {error && (
        <Text size="body-sm" tone="error" className="pl-[1.9rem]">
          {error}
        </Text>
      )}
    </div>
  );
}

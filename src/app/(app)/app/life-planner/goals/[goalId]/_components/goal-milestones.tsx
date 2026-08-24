"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, CircleDot, Trash2, type LucideIcon } from "lucide-react";

import { Alert, Button, DatePicker, FormField, Icon, Input, Text } from "@/components/ui";
import type { LifeGoalMilestone, LifeGoalMilestoneStatus } from "@/types/life-planner";

import { createMilestoneFormAction, deleteMilestoneAction, moveMilestoneAction, updateMilestoneAction, type CreateMilestoneFormState } from "../actions";
import { formatGoalDate } from "../../_components/goal-visuals";

const initialState: CreateMilestoneFormState = { status: "idle" };

// Cycles not_started -> in_progress -> completed -> not_started - the same
// "no gamification, just a plain forward cycle" register the goal status
// select already keeps, minus a "pause" concept a milestone doesn't need.
const NEXT_STATUS: Record<LifeGoalMilestoneStatus, LifeGoalMilestoneStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
};

const STATUS_ICON: Record<LifeGoalMilestoneStatus, LucideIcon> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CheckCircle2,
};

const STATUS_LABEL: Record<LifeGoalMilestoneStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const iconButtonClass =
  "-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface GoalMilestonesProps {
  goalId: string;
  milestones: LifeGoalMilestone[];
}

/**
 * The goal detail page's own "Milestones" section (Phase 3) - a plain
 * ordered list with a status-cycle button per row, reorder, delete, and an
 * inline "Add milestone" form, the same "expand in place, no modal" pattern
 * `AddAreaForm` already establishes. Status cycles forward through the
 * three-step scale on click (see `NEXT_STATUS`) rather than opening a
 * `<Select>` - a milestone only ever needs "move it along," not a random
 * jump between all three states.
 */
export function GoalMilestones({ goalId, milestones }: GoalMilestonesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createMilestoneFormAction.bind(null, goalId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  return (
    <div className="flex flex-col gap-3">
      {milestones.length === 0 ? (
        <Text size="body-sm" tone="muted">
          No milestones yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {milestones.map((milestone, index) => (
            <MilestoneRow key={milestone.id} goalId={goalId} milestone={milestone} isFirst={index === 0} isLast={index === milestones.length - 1} />
          ))}
        </div>
      )}

      {isAdding ? (
        <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-muted/40 p-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that milestone">
              {formState.message}
            </Alert>
          )}

          <FormField label="Title">
            <Input name="title" placeholder="e.g. Finish the first draft" maxLength={120} required />
          </FormField>

          <FormField label="Target date" hint="Optional.">
            <DatePicker name="targetDate" aria-label="Milestone target date" />
          </FormField>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add milestone
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} disabled={isCreating}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setIsAdding(true)}>
          Add milestone
        </Button>
      )}
    </div>
  );
}

interface MilestoneRowProps {
  goalId: string;
  milestone: LifeGoalMilestone;
  isFirst: boolean;
  isLast: boolean;
}

function MilestoneRow({ goalId, milestone, isFirst, isLast }: MilestoneRowProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const StatusIcon = STATUS_ICON[milestone.status];
  const targetDateLabel = formatGoalDate(milestone.targetDate);

  async function handleCycleStatus() {
    setIsSaving(true);
    const result = await updateMilestoneAction(goalId, milestone.id, { status: NEXT_STATUS[milestone.status] });
    setIsSaving(false);
    setError(result.status === "success" ? null : (result.message ?? "Couldn't update that milestone."));
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${milestone.title}"? This can't be undone.`)) return;
    setIsDeleting(true);
    const result = await deleteMilestoneAction(goalId, milestone.id);
    setIsDeleting(false);
    if (result.status !== "success") setError(result.message ?? "Couldn't remove that milestone.");
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line-subtle bg-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => void handleCycleStatus()}
          disabled={isSaving}
          className="flex min-w-0 items-center gap-2 text-left disabled:opacity-60"
        >
          <Icon icon={StatusIcon} size="sm" className={milestone.status === "completed" ? "shrink-0 text-success" : "shrink-0 text-ink-faint"} />
          <span className={`truncate text-body-sm font-medium ${milestone.status === "completed" ? "text-ink-muted line-through" : "text-ink"}`}>
            {milestone.title}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => void moveMilestoneAction(goalId, milestone.id, "up")}
            disabled={isFirst}
            aria-label={`Move "${milestone.title}" earlier`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronUp} size="sm" />
          </button>
          <button
            type="button"
            onClick={() => void moveMilestoneAction(goalId, milestone.id, "down")}
            disabled={isLast}
            aria-label={`Move "${milestone.title}" later`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronDown} size="sm" />
          </button>
          <button type="button" onClick={() => void handleDelete()} disabled={isDeleting} aria-label={`Remove "${milestone.title}"`} className={iconButtonClass}>
            <Icon icon={Trash2} size="sm" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-6">
        <Text size="body-sm" tone="faint">
          {STATUS_LABEL[milestone.status]}
          {targetDateLabel ? ` · ${targetDateLabel}` : ""}
        </Text>
      </div>

      {error && (
        <Text size="body-sm" tone="error" className="pl-6">
          {error}
        </Text>
      )}
    </div>
  );
}

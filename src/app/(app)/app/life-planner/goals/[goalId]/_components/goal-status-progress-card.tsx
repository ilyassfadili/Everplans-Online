"use client";

import { useState } from "react";

import { Alert, Button, Card, FormField, Heading, Select, Text } from "@/components/ui";
import type { LifeGoal } from "@/types/life-planner";

import { updateLifeGoalAction } from "../../actions";
import { STATUS_OPTIONS } from "../../_components/goal-visuals";

/** Which source, if any, currently drives `goal.progress` - `null` means the goal has no milestones or action steps yet, so progress is still the plain manual number the edit form writes directly. */
export type GoalProgressSource = "action_steps" | "milestones" | null;

interface GoalStatusProgressCardProps {
  goal: LifeGoal;
  progressSource: GoalProgressSource;
}

const PROGRESS_SOURCE_COPY: Record<Exclude<GoalProgressSource, null>, string> = {
  action_steps: "Progress is computed from your action steps.",
  milestones: "Progress is computed from your milestones.",
};

/**
 * The goal detail page's own status-and-progress control (Phase 2 §4,
 * extended Phase 3 §5) - a separate card from the main info edit form, since
 * these two fields change far more often than a goal's
 * title/description/notes and deserve a quicker, always-visible control
 * rather than living behind the "Edit" toggle.
 *
 * Once the goal has any milestones or action steps (`progressSource` is
 * non-`null`), `recomputeGoalProgress`
 * (`@/lib/life-planner/life-goal-planning`) owns `progress` from then on -
 * this card switches to a read-only bar with a short explanation instead of
 * the number input, so there's never a UI that lets a manual edit get
 * silently overwritten by the next action-step toggle. A goal with neither
 * keeps the original manual "no gamification" number input untouched.
 */
export function GoalStatusProgressCard({ goal, progressSource }: GoalStatusProgressCardProps) {
  const [status, setStatus] = useState(goal.status);
  const [progress, setProgress] = useState(goal.progress);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isProgressComputed = progressSource !== null;

  async function handleSave() {
    setIsSaving(true);
    const result = await updateLifeGoalAction(goal.id, isProgressComputed ? { status } : { status, progress });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsDirty(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  return (
    <Card variant="standard" padding="lg" className="flex flex-col gap-4">
      <Heading as="h2" size="h4">
        Status &amp; progress
      </Heading>

      {error && (
        <Alert variant="error" title="Couldn't save that change">
          {error}
        </Alert>
      )}

      <div className={isProgressComputed ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <FormField label="Status">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as LifeGoal["status"]);
              setIsDirty(true);
            }}
            options={STATUS_OPTIONS}
            aria-label="Status"
          />
        </FormField>

        {!isProgressComputed && (
          <FormField label="Progress" hint="0-100%">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setProgress(Number.isNaN(next) ? 0 : Math.min(100, Math.max(0, next)));
                  setIsDirty(true);
                }}
                aria-label="Progress percent"
                className="h-10 w-full rounded-md border border-line bg-surface px-3 text-body text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              />
              <Text size="body-sm" tone="muted">
                %
              </Text>
            </div>
          </FormField>
        )}
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300 ease-standard"
          style={{ width: `${isProgressComputed ? goal.progress : progress}%` }}
        />
      </div>

      {isProgressComputed && progressSource && (
        <Text size="body-sm" tone="faint">
          {goal.progress}% · {PROGRESS_SOURCE_COPY[progressSource]}
        </Text>
      )}

      {isDirty && (
        <div>
          <Button size="sm" onClick={() => void handleSave()} loading={isSaving}>
            Save
          </Button>
        </div>
      )}
    </Card>
  );
}

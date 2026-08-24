"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Card, DatePicker, Icon, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { formatCurrency } from "@/lib/budget/currency";
import { calculateSuggestedContributionCents, getGoalProgressStatus } from "@/lib/budget/goal-progress";
import { getPeriodLabel } from "@/lib/budget/period";
import type { BudgetGoal, BudgetPeriodType, GoalProgressStatus } from "@/types/budget";

import { editGoalAction, removeGoalAction } from "../actions";

// Always derived from the goal's own amounts/date (`getGoalProgressStatus`),
// never a manually-set field - see `GoalProgressStatus`'s own comment for
// why. "Behind plan" reads as informative, not a red badge - grouped with
// warning's amber, not error's red, since a missed date isn't a mistake.
const STATUS_LABEL: Record<GoalProgressStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "near-target": "Near target",
  completed: "Completed",
  "behind-plan": "Behind plan",
};

const STATUS_BADGE: Record<GoalProgressStatus, "neutral" | "brand" | "success" | "warning"> = {
  "not-started": "neutral",
  "in-progress": "brand",
  "near-target": "brand",
  completed: "success",
  "behind-plan": "warning",
};

function formatTargetDate(targetDate: string | null): string | null {
  if (!targetDate) return null;
  const date = new Date(`${targetDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface GoalCardProps {
  goal: BudgetGoal;
  currency: string;
  periodType: BudgetPeriodType;
}

export function GoalCard({ goal, currency, periodType }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percent = goal.targetAmountCents > 0 ? Math.min(100, Math.round((goal.currentAmountCents / goal.targetAmountCents) * 100)) : 0;

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const targetAmountCents = formData.get("targetAmountCents");
    const currentAmountCents = formData.get("currentAmountCents");
    const targetDate = formData.get("targetDate");
    const description = formData.get("description");

    setIsSaving(true);
    const result = await editGoalAction(goal.id, {
      name: typeof name === "string" ? name : undefined,
      targetAmountCents: typeof targetAmountCents === "string" ? targetAmountCents : undefined,
      currentAmountCents: typeof currentAmountCents === "string" ? currentAmountCents : undefined,
      targetDate: typeof targetDate === "string" ? targetDate : "",
      description: typeof description === "string" ? description : "",
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleRemove() {
    if (window.confirm(`Remove the "${goal.name}" goal?`)) {
      void removeGoalAction(goal.id);
    }
  }

  if (isEditing) {
    return (
      <Card variant="standard" padding="lg">
        <form action={handleSave} className="flex flex-col gap-3">
          <Input name="name" defaultValue={goal.name} maxLength={100} aria-label="Goal name" required />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              name="targetAmountCents"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(goal.targetAmountCents / 100).toFixed(2)}
              aria-label="Target amount"
              required
            />
            <Input
              name="currentAmountCents"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(goal.currentAmountCents / 100).toFixed(2)}
              aria-label="Current progress"
            />
            <DatePicker name="targetDate" defaultValue={goal.targetDate ?? ""} aria-label="Target date" />
          </div>
          <Textarea name="description" defaultValue={goal.description ?? ""} placeholder="Why this goal? (optional)" rows={2} maxLength={500} aria-label="Description" />
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
      </Card>
    );
  }

  const targetDateLabel = formatTargetDate(goal.targetDate);
  const progressStatus = getGoalProgressStatus(goal);
  const suggestedContributionCents = calculateSuggestedContributionCents(goal, periodType);

  return (
    <Card variant="standard" padding="lg" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text weight="medium" className="text-ink">
            {goal.name}
          </Text>
          {targetDateLabel && (
            <Text size="body-sm" tone="muted" className="mt-0.5">
              Target: {targetDateLabel}
            </Text>
          )}
        </div>
        <Badge variant={STATUS_BADGE[progressStatus]}>{STATUS_LABEL[progressStatus]}</Badge>
      </div>

      {goal.description && (
        <Text size="body-sm" tone="muted">
          {goal.description}
        </Text>
      )}

      <div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-standard" style={{ width: `${percent}%` }} />
        </div>
        <Text size="body-sm" tone="muted" className="mt-2">
          {formatCurrency(goal.currentAmountCents, currency)} of {formatCurrency(goal.targetAmountCents, currency)} ({percent}%)
        </Text>
        {suggestedContributionCents !== null && (
          <Text size="body-sm" tone="faint" className="mt-1">
            Save about {formatCurrency(suggestedContributionCents, currency)} per {getPeriodLabel(periodType)} to reach this by {targetDateLabel}.
          </Text>
        )}
      </div>

      <div className="flex items-center gap-1 self-end">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${goal.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove "${goal.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </Card>
  );
}

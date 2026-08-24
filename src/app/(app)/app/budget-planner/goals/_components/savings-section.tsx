"use client";

import { useActionState, useState } from "react";
import { PiggyBank, Pencil, Trash2 } from "lucide-react";

import { Alert, Button, Card, EmptyState, Heading, Icon, Label, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/budget/currency";
import { getPeriodLabel } from "@/lib/budget/period";
import type { BudgetGoal, BudgetPeriodType, BudgetRecurringFrequency, BudgetSavingsTarget } from "@/types/budget";

import {
  createSavingsTargetFormAction,
  editSavingsTargetAction,
  removeSavingsTargetAction,
  type CreateSavingsTargetFormState,
} from "../actions";

const initialState: CreateSavingsTargetFormState = { status: "idle" };

const FREQUENCY_OPTIONS: { value: BudgetRecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const FREQUENCY_LABEL: Record<BudgetRecurringFrequency, string> = {
  weekly: "week",
  biweekly: "2 weeks",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

interface SavingsRowProps {
  target: BudgetSavingsTarget;
  currency: string;
  goals: BudgetGoal[];
}

function SavingsRow({ target, currency, goals }: SavingsRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalOptions = [{ value: "", label: "General savings" }, ...goals.map((goal) => ({ value: goal.id, label: goal.name }))];
  const linkedGoal = goals.find((goal) => goal.id === target.goalId) ?? null;

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const plannedAmountCents = formData.get("plannedAmountCents");
    const frequency = formData.get("frequency");
    const goalId = formData.get("goalId");

    setIsSaving(true);
    const result = await editSavingsTargetAction(target.id, {
      name: typeof name === "string" ? name : undefined,
      plannedAmountCents: typeof plannedAmountCents === "string" ? plannedAmountCents : undefined,
      frequency: typeof frequency === "string" ? (frequency as BudgetRecurringFrequency) : undefined,
      goalId: typeof goalId === "string" ? goalId : "",
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
    if (window.confirm(`Remove "${target.name}"?`)) {
      void removeSavingsTargetAction(target.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input name="name" defaultValue={target.name} maxLength={100} aria-label="Name" required />
            <Input
              name="plannedAmountCents"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(target.plannedAmountCents / 100).toFixed(2)}
              aria-label="Amount"
              className="sm:w-32"
              required
            />
            <Select name="frequency" defaultValue={target.frequency} options={FREQUENCY_OPTIONS} aria-label="Frequency" className="sm:w-36" />
          </div>
          <Select name="goalId" defaultValue={target.goalId ?? ""} options={goalOptions} aria-label="Goal" />
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
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <Text size="body" weight="medium" className="text-ink">
          {target.name}
        </Text>
        <Text size="body-sm" tone="muted" className="mt-1">
          {formatCurrency(target.plannedAmountCents, currency)} per {FREQUENCY_LABEL[target.frequency]}
          {linkedGoal ? ` · toward ${linkedGoal.name}` : " · general savings"}
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${target.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove "${target.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

interface SavingsSectionProps {
  planId: string;
  savingsTargets: BudgetSavingsTarget[];
  goals: BudgetGoal[];
  currency: string;
  periodType: BudgetPeriodType;
  totalPlannedCents: number;
}

/**
 * Savings planning (Prompt 3 Phase 4) - deliberately living on the Goals
 * page rather than a new top-level nav item, since "Income → Available
 * Money → Savings → Goals" is naturally one continuous idea here, not a
 * separate module. A savings target can point at a specific goal or stay
 * "general savings" - either way it's a planned, recurring intention, never
 * a transaction (see `@/lib/budget/savings-targets`'s own comment on why
 * this never writes to a goal's actual progress).
 */
export function SavingsSection({ planId, savingsTargets, goals, currency, periodType, totalPlannedCents }: SavingsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createSavingsTargetFormAction.bind(null, planId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  const goalOptions = [{ value: "", label: "General savings" }, ...goals.map((goal) => ({ value: goal.id, label: goal.name }))];

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading as="h2" size="h4">
            Savings plans
          </Heading>
          {totalPlannedCents > 0 && (
            <Text size="body-sm" tone="muted" className="mt-0.5">
              {formatCurrency(totalPlannedCents, currency)} planned per {getPeriodLabel(periodType)}
            </Text>
          )}
        </div>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add a savings plan
          </Button>
        )}
      </div>

      {savingsTargets.length === 0 && !isAdding && (
        <EmptyState
          icon={PiggyBank}
          title="Make savings part of the plan"
          description="Set aside a recurring amount, toward a goal or just general savings, so it feels deliberate instead of whatever's left over."
          className="mt-4 py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add a savings plan
            </Button>
          }
        />
      )}

      {savingsTargets.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {savingsTargets.map((target) => (
            <SavingsRow key={target.id} target={target} currency={currency} goals={goals} />
          ))}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that savings plan">
              {formState.message}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-savings-name">Name</Label>
              <Input id="new-savings-name" name="name" placeholder="e.g. Monthly savings" maxLength={100} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-savings-amount">Amount</Label>
              <Input id="new-savings-amount" name="plannedAmountCents" type="number" step="0.01" min="0" className="sm:w-32" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-savings-frequency">Frequency</Label>
              <Select id="new-savings-frequency" name="frequency" defaultValue="monthly" options={FREQUENCY_OPTIONS} className="sm:w-36" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-savings-goal">Goal</Label>
            <Select id="new-savings-goal" name="goalId" defaultValue="" options={goalOptions} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add savings plan
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

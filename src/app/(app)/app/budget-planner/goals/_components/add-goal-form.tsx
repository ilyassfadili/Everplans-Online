"use client";

import { useActionState, useState } from "react";
import { Plus, Target } from "lucide-react";

import { Alert, Button, Card, DatePicker, EmptyState, Icon, Label } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";

import { createGoalFormAction, type CreateGoalFormState } from "../actions";

const initialState: CreateGoalFormState = { status: "idle" };

interface AddGoalFormProps {
  planId: string;
  hasAnyGoals: boolean;
}

/** The Goals page's own add form - collapsed behind a button until opened, same "don't show every option immediately" convention every other add flow in this product follows. */
export function AddGoalForm({ planId, hasAnyGoals }: AddGoalFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const action = createGoalFormAction.bind(null, planId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  if (!isAdding) {
    if (!hasAnyGoals) {
      return (
        <Card variant="standard" padding="lg">
          <EmptyState
            icon={Target}
            title="Set your first goal"
            description="An emergency fund, a trip, a big purchase - give your budget something to work toward."
            className="py-10"
            action={
              <Button size="sm" onClick={() => setIsAdding(true)}>
                Add a goal
              </Button>
            }
          />
        </Card>
      );
    }

    return (
      <Button variant="outline" onClick={() => setIsAdding(true)} leadingIcon={<Icon icon={Plus} size="sm" />} className="w-fit">
        Add a goal
      </Button>
    );
  }

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn't add that goal" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-goal-name">Goal name</Label>
          <Input id="new-goal-name" name="name" placeholder="e.g. Emergency fund" maxLength={100} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-goal-amount">Target amount</Label>
            <Input id="new-goal-amount" name="targetAmountCents" type="number" step="0.01" min="0" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-goal-date">Target date</Label>
            <DatePicker id="new-goal-date" name="targetDate" />
          </div>
        </div>
        {showDescription ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-goal-description">
              Why this goal? <span className="font-normal text-ink-faint">(optional)</span>
            </Label>
            <Textarea id="new-goal-description" name="description" rows={2} maxLength={500} placeholder="Any context worth remembering" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="w-fit text-body-sm font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover"
          >
            + Add context
          </button>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={isCreating}>
            Add goal
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

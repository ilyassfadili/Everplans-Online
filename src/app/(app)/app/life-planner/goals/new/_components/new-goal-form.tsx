"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, FormField, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea } from "@/types/life-planner";

import { createLifeGoalFormAction, type CreateLifeGoalFormState } from "../../actions";
import { GoalAreaSelect } from "../../_components/goal-area-select";
import { PRIORITY_OPTIONS } from "../../_components/goal-visuals";

const initialState: CreateLifeGoalFormState = { status: "idle" };

interface NewGoalFormProps {
  areas: LifeArea[];
}

/**
 * The "New goal" page's own form (Phase 2 §4) - a dedicated route rather
 * than an expand-in-place panel like `AddAreaForm`, since a goal carries
 * enough fields (area, target date, priority, notes) to earn a full page.
 * On success, `createLifeGoalFormAction` redirects straight to the new
 * goal's detail page - there's no "stay here and add another" case to
 * handle client-side.
 */
export function NewGoalForm({ areas }: NewGoalFormProps) {
  const [formState, formAction, isCreating] = useActionState(createLifeGoalFormAction, initialState);

  return (
    <Card variant="standard" padding="lg">
      <form action={formAction} className="flex flex-col gap-4">
        {formState.status !== "idle" && (
          <Alert variant="error" title="Couldn't add that goal">
            {formState.message}
          </Alert>
        )}

        <FormField label="Title">
          <Input name="title" placeholder="e.g. Run a half marathon" maxLength={120} required />
        </FormField>

        <FormField label="Description" hint="Optional - a sentence or two about what this goal means to you.">
          <Textarea name="description" rows={3} maxLength={1000} placeholder="What does success look like?" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Life Area" hint="Optional - file this under one of your areas.">
            <GoalAreaSelect areas={areas} />
          </FormField>
          <FormField label="Priority">
            <Select name="priority" defaultValue="medium" options={PRIORITY_OPTIONS} aria-label="Priority" />
          </FormField>
        </div>

        <FormField label="Target date" hint="Optional.">
          <DatePicker name="targetDate" aria-label="Target date" />
        </FormField>

        <FormField label="Notes" hint="Optional - anything else worth keeping close.">
          <Textarea name="notes" rows={3} maxLength={1000} />
        </FormField>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isCreating}>
            Add goal
          </Button>
          <Button variant="ghost" href="/app/life-planner/goals">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

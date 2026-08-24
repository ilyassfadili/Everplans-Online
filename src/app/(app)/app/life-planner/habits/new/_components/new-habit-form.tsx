"use client";

import { useActionState, useState } from "react";

import { Alert, Button, Card, FormField, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea, LifeGoal, LifeHabitFrequency } from "@/types/life-planner";

import { createHabitFormAction, type CreateHabitFormState } from "../../actions";
import { GoalAreaSelect } from "../../../goals/_components/goal-area-select";
import { HabitGoalSelect } from "../../_components/habit-goal-select";
import { FREQUENCY_OPTIONS } from "../../_components/habit-visuals";

const initialState: CreateHabitFormState = { status: "idle" };

interface NewHabitFormProps {
  areas: LifeArea[];
  goals: LifeGoal[];
}

/**
 * The "New habit" page's own form (Phase 3 §5) - a dedicated route, the
 * same shape `NewRoutineForm` uses. `frequency` is tracked in local state
 * (not left to the DOM alone) purely so the "target per period" field can
 * be shown/hidden live as the user changes it - `"daily"` hides it outright
 * (the field is meaningless for that frequency, see
 * `LifeHabit.targetPerPeriod`'s own comment for the exact quirk), leaving it
 * visible only for `"weekly"`/`"x_per_week"`. On success,
 * `createHabitFormAction` redirects straight to the new habit's own detail
 * page - there's no "stay here and add another" case to handle
 * client-side.
 */
export function NewHabitForm({ areas, goals }: NewHabitFormProps) {
  const [formState, formAction, isCreating] = useActionState(createHabitFormAction, initialState);
  const [frequency, setFrequency] = useState<LifeHabitFrequency>("daily");
  const needsTargetPerPeriod = frequency !== "daily";

  return (
    <Card variant="standard" padding="lg">
      <form action={formAction} className="flex flex-col gap-4">
        {formState.status !== "idle" && (
          <Alert variant="error" title="Couldn't create that habit">
            {formState.message}
          </Alert>
        )}

        <FormField label="Name">
          <Input name="name" placeholder="e.g. Drink water" maxLength={80} required />
        </FormField>

        <FormField label="Description" hint="Optional.">
          <Textarea name="description" rows={2} maxLength={300} placeholder="Why this habit matters to you" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Life Area">
            <GoalAreaSelect areas={areas} name="lifeAreaId" />
          </FormField>
          <FormField label="Goal">
            <HabitGoalSelect goals={goals} name="goalId" />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Frequency">
            <Select
              name="frequency"
              defaultValue="daily"
              options={FREQUENCY_OPTIONS}
              aria-label="Frequency"
              onValueChange={(value) => setFrequency(value as LifeHabitFrequency)}
            />
          </FormField>
          {needsTargetPerPeriod && (
            <FormField label="Times per week" hint="1-14.">
              <Input name="targetPerPeriod" type="number" min={1} max={14} defaultValue={1} aria-label="Times per week" />
            </FormField>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isCreating}>
            Create habit
          </Button>
          <Button variant="ghost" href="/app/life-planner/habits">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

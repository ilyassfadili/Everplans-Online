"use client";

import { useActionState, useState } from "react";

import { Alert, Button, Card, FormField, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeRoutineFrequency } from "@/types/life-planner";

import { createRoutineFormAction, type CreateRoutineFormState } from "../../actions";
import { ActiveDaysPicker } from "../../_components/active-days-picker";
import { FREQUENCY_OPTIONS, ROUTINE_TYPE_OPTIONS } from "../../_components/routine-visuals";

const initialState: CreateRoutineFormState = { status: "idle" };

/**
 * The "New routine" page's own form (Phase 2 §4) - a dedicated route, the
 * same shape `NewGoalForm` uses. `frequency` is tracked in local state (not
 * left to the DOM alone) purely so `ActiveDaysPicker` can be shown/hidden
 * live as the user changes it - it's only relevant, and only rendered, once
 * `frequency` is `"weekly"` or `"custom"` (Phase 2 §4's own instruction).
 * On success, `createRoutineFormAction` redirects straight to the new
 * routine's detail page - there's no "stay here and add another" case to
 * handle client-side.
 */
export function NewRoutineForm() {
  const [formState, formAction, isCreating] = useActionState(createRoutineFormAction, initialState);
  const [frequency, setFrequency] = useState<LifeRoutineFrequency>("daily");
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const needsDayPicker = frequency === "weekly" || frequency === "custom";

  return (
    <Card variant="standard" padding="lg">
      <form action={formAction} className="flex flex-col gap-4">
        {formState.status !== "idle" && (
          <Alert variant="error" title="Couldn't create that routine">
            {formState.message}
          </Alert>
        )}

        <FormField label="Name">
          <Input name="name" placeholder="e.g. Morning routine" maxLength={80} required />
        </FormField>

        <FormField label="Purpose" hint="Optional - what this routine is for.">
          <Textarea name="purpose" rows={2} maxLength={300} placeholder="Why this routine matters to you" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type">
            <Select name="routineType" defaultValue="custom" options={ROUTINE_TYPE_OPTIONS} aria-label="Routine type" />
          </FormField>
          <FormField label="Frequency">
            <Select
              name="frequency"
              defaultValue="daily"
              options={FREQUENCY_OPTIONS}
              aria-label="Frequency"
              onValueChange={(value) => setFrequency(value as LifeRoutineFrequency)}
            />
          </FormField>
        </div>

        {needsDayPicker && (
          <FormField label="Which days?" hint="Pick at least one day.">
            <ActiveDaysPicker value={activeDays} onChange={setActiveDays} />
          </FormField>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isCreating}>
            Create routine
          </Button>
          <Button variant="ghost" href="/app/life-planner/routines">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

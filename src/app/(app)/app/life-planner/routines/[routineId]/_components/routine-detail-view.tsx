"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Card, FormField, Heading, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeRoutine, LifeRoutineFrequency, LifeRoutineItem } from "@/types/life-planner";
import type { TodaysRoutineGroup } from "@/lib/life-planner/life-routines";

import { deleteRoutineAction, updateRoutineAction } from "../../actions";
import { ActiveDaysPicker } from "../../_components/active-days-picker";
import { describeRoutineFrequency, FREQUENCY_OPTIONS, ROUTINE_TYPE_LABEL, ROUTINE_TYPE_OPTIONS } from "../../_components/routine-visuals";
import { RoutineItems } from "./routine-items";
import { TodaysChecklist } from "./todays-checklist";

interface RoutineDetailViewProps {
  routine: LifeRoutine;
  items: LifeRoutineItem[];
  todaysGroup: TodaysRoutineGroup | null;
}

/**
 * The routine detail page's own content (Phase 2 §4) - the main info card
 * (name/purpose/type/frequency/days) as a single view/edit-in-place card,
 * the same "swap the card's own content, no separate route or modal"
 * toggle `AreaCard`/`GoalDetailView` already use, plus the "Checklist
 * items" section (`RoutineItems`) and, only when this routine is actually
 * due today, the "Today's checklist" mini-section (`TodaysChecklist`).
 */
export function RoutineDetailView({ routine, items, todaysGroup }: RoutineDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<LifeRoutineFrequency>(routine.frequency);
  const [activeDays, setActiveDays] = useState<number[]>(routine.activeDays);
  const needsDayPicker = frequency === "weekly" || frequency === "custom";

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const purpose = formData.get("purpose");
    const routineType = formData.get("routineType");

    setIsSaving(true);
    const result = await updateRoutineAction(routine.id, {
      name: typeof name === "string" ? name : undefined,
      purpose: typeof purpose === "string" ? purpose : "",
      routineType: typeof routineType === "string" ? (routineType as LifeRoutine["routineType"]) : undefined,
      frequency,
      activeDays,
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function startEditing() {
    setFrequency(routine.frequency);
    setActiveDays(routine.activeDays);
    setIsEditing(true);
  }

  function handleDelete() {
    if (!window.confirm(`Remove "${routine.name}"? This can't be undone.`)) {
      return;
    }
    void deleteRoutineAction(routine.id);
    router.push("/app/life-planner/routines");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="standard" padding="lg">
        {isEditing ? (
          <form action={handleSave} className="flex flex-col gap-4">
            {error && (
              <Alert variant="error" title="Couldn't save that change">
                {error}
              </Alert>
            )}

            <FormField label="Name">
              <Input name="name" defaultValue={routine.name} maxLength={80} required />
            </FormField>

            <FormField label="Purpose">
              <Textarea name="purpose" rows={2} maxLength={300} defaultValue={routine.purpose ?? ""} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Type">
                <Select name="routineType" defaultValue={routine.routineType} options={ROUTINE_TYPE_OPTIONS} aria-label="Routine type" />
              </FormField>
              <FormField label="Frequency">
                <Select
                  name="frequency"
                  defaultValue={routine.frequency}
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
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Heading as="h1" size="h3">
                  {routine.name}
                </Heading>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{ROUTINE_TYPE_LABEL[routine.routineType]}</Badge>
                  {!routine.isActive && <Badge variant="neutral">Paused</Badge>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={startEditing}>
                Edit
              </Button>
            </div>

            <div className="mt-4 border-t border-line-subtle pt-4">
              <Text size="body-sm" tone="muted">
                {describeRoutineFrequency(routine)}
              </Text>
            </div>

            {routine.purpose && (
              <Text size="body-sm" tone="muted" className="mt-4 border-t border-line-subtle pt-4">
                {routine.purpose}
              </Text>
            )}
          </>
        )}
      </Card>

      {todaysGroup && (
        <Card variant="standard" padding="lg" className="flex flex-col gap-4">
          <Heading as="h2" size="h4">
            Today&rsquo;s checklist
          </Heading>
          <TodaysChecklist items={todaysGroup.items} completions={todaysGroup.completions} />
        </Card>
      )}

      <Card variant="standard" padding="lg" className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          Checklist items
        </Heading>
        <RoutineItems routineId={routine.id} items={items} />
      </Card>

      <Button variant="ghost" size="sm" className="self-start text-error hover:text-error" onClick={handleDelete}>
        Remove routine
      </Button>
    </div>
  );
}

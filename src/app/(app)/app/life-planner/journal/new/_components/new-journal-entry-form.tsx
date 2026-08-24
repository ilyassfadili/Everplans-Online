"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, FormField } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea, LifeGoal } from "@/types/life-planner";

import { createJournalEntryFormAction, type CreateJournalEntryFormState } from "../../actions";
import { GoalAreaSelect } from "../../../goals/_components/goal-area-select";
import { TaskGoalSelect } from "../../../tasks/_components/task-goal-select";

const initialState: CreateJournalEntryFormState = { status: "idle" };

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses, e.g. `DatePicker`'s own `toIsoDate`). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface NewJournalEntryFormProps {
  areas: LifeArea[];
  goals: LifeGoal[];
  defaultGoalId?: string;
}

/**
 * The Journal composer's own form (Life Planner Prompt 4 Phase 2) - title,
 * entry date, a generously-sized `Textarea` for the entry body (deliberately
 * not a rich text editor - AGENTS.md keeps dependencies as-is, no new
 * editor library), and optional Life Area/Goal association. `rows={14}` on
 * the body field is the one concrete "make writing feel roomy, not like
 * filling out a form" choice here - every other field on this page is a
 * plain single-line control, the same restraint `NewGoalForm` keeps for its
 * own secondary fields. On success, `createJournalEntryFormAction` redirects
 * straight to the new entry's own detail page - there's no "stay here and
 * write another" case to handle client-side.
 */
export function NewJournalEntryForm({ areas, goals, defaultGoalId }: NewJournalEntryFormProps) {
  const [formState, formAction, isCreating] = useActionState(createJournalEntryFormAction, initialState);

  return (
    <Card variant="standard" padding="lg" className="border-line-subtle/60">
      <form action={formAction} className="flex flex-col gap-5">
        {formState.status !== "idle" && (
          <Alert variant="error" title="Couldn't save that entry">
            {formState.message}
          </Alert>
        )}

        <FormField label="Title">
          <Input name="title" placeholder="Give this entry a title" maxLength={140} required autoFocus />
        </FormField>

        <FormField label="Date" hint="Defaults to today - change it if you're writing about another day.">
          <DatePicker name="entryDate" defaultValue={todayIso()} aria-label="Entry date" />
        </FormField>

        <FormField label="Your entry">
          <Textarea name="content" rows={14} maxLength={10000} placeholder="Write whatever's on your mind…" className="leading-relaxed" required />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Life Area" hint="Optional - file this under one of your areas.">
            <GoalAreaSelect areas={areas} />
          </FormField>
          <FormField label="Goal" hint="Optional - link this reflection to a goal.">
            <TaskGoalSelect goals={goals} defaultValue={defaultGoalId} />
          </FormField>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isCreating}>
            Save entry
          </Button>
          <Button variant="ghost" href="/app/life-planner/journal">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

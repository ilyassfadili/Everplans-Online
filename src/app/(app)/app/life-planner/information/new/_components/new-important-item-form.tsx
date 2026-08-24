"use client";

import { useActionState } from "react";

import { Alert, Button, Card, FormField } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea, LifeGoal } from "@/types/life-planner";

import { createImportantItemFormAction, type CreateImportantItemFormState } from "../../actions";
import { GoalAreaSelect } from "../../../goals/_components/goal-area-select";
import { TaskGoalSelect } from "../../../tasks/_components/task-goal-select";
import { ImportantItemCategorySelect } from "../../_components/important-item-category-select";

const initialState: CreateImportantItemFormState = { status: "idle" };

interface NewImportantItemFormProps {
  areas: LifeArea[];
  goals: LifeGoal[];
  defaultGoalId?: string;
}

/**
 * The Important Items composer's own form (Life Planner Prompt 4 Phase 3) -
 * title, category, a roomy `Textarea` for the content body, and optional
 * Life Area/Goal association - the same field set `NewJournalEntryForm`
 * uses one module over, minus the entry date (this table has no dated-entry
 * concept, see `LifeImportantItem`'s own comment) and plus `category` in its
 * place. On success, `createImportantItemFormAction` redirects straight to
 * the new item's own detail page.
 */
export function NewImportantItemForm({ areas, goals, defaultGoalId }: NewImportantItemFormProps) {
  const [formState, formAction, isCreating] = useActionState(createImportantItemFormAction, initialState);

  return (
    <Card variant="standard" padding="lg" className="border-line-subtle/60">
      <form action={formAction} className="flex flex-col gap-5">
        {formState.status !== "idle" && (
          <Alert variant="error" title="Couldn't save that item">
            {formState.message}
          </Alert>
        )}

        <FormField label="Title">
          <Input name="title" placeholder="Give this a title" maxLength={140} required autoFocus />
        </FormField>

        <FormField label="Category">
          <ImportantItemCategorySelect />
        </FormField>

        <FormField label="Details">
          <Textarea name="content" rows={12} maxLength={5000} placeholder="Write the details worth keeping close…" className="leading-relaxed" required />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Life Area" hint="Optional - file this under one of your areas.">
            <GoalAreaSelect areas={areas} />
          </FormField>
          <FormField label="Goal" hint="Optional - link this to a goal.">
            <TaskGoalSelect goals={goals} defaultValue={defaultGoalId} />
          </FormField>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isCreating}>
            Save item
          </Button>
          <Button variant="ghost" href="/app/life-planner/information">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

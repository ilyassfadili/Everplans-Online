"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { Alert, Button, Card, DatePicker, FormField, Input, Select } from "@/components/ui";

import { createTaskFormAction, type CreateTaskFormState } from "../actions";
import { PRIORITY_OPTIONS } from "./task-visuals";

const initialState: CreateTaskFormState = { status: "idle" };

/**
 * The tasks list's own "quick add" form (Phase 1 §4: "title + due date +
 * priority is enough for quick add") - the codebase's established "plain
 * form action, expand in place" pattern `AddAreaForm`
 * (`@/app/(app)/app/life-planner/areas/_components/add-area-form`) already
 * uses, kept deliberately narrow here: description, Life Area, and goal are
 * still real fields, just left to the task's own detail page (the full edit
 * form) rather than crowding this one-line trigger.
 */
export function QuickAddTaskForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [formState, formAction, isCreating] = useActionState(createTaskFormAction, initialState);

  if (!isAdding) {
    return (
      <Button type="button" variant="outline" size="sm" className="self-start" leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setIsAdding(true)}>
        New task
      </Button>
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <form action={formAction} className="flex flex-col gap-4">
        {formState.status !== "idle" && (
          <Alert variant="error" title="Couldn't add that task">
            {formState.message}
          </Alert>
        )}

        <FormField label="Title">
          <Input name="title" placeholder="e.g. Renew passport" maxLength={140} required autoFocus />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Due date" hint="Optional.">
            <DatePicker name="dueDate" aria-label="Due date" />
          </FormField>
          <FormField label="Priority">
            <Select name="priority" defaultValue="medium" options={PRIORITY_OPTIONS} aria-label="Priority" />
          </FormField>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={isCreating}>
            Add task
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} disabled={isCreating}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

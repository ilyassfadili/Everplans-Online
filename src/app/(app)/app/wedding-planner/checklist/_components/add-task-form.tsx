"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { PrioritySelect } from "@/components/wedding/priority-select";
import type { WeddingMilestone } from "@/types/wedding";

import { createTaskFormAction, type CreateTaskFormState } from "../../actions";

const initialState: CreateTaskFormState = { status: "idle" };

interface AddTaskFormProps {
  weddingId: string;
  milestones: WeddingMilestone[];
}

/**
 * The checklist's quick-add row (Phase 3: "quick... avoid unnecessary
 * fields... work well on mobile"). Always visible above the list rather
 * than behind a modal - this design system has no dialog/sheet primitive
 * (Phase 3's own "depending on the existing design system" qualifier), and
 * a plain inline form is both simpler and better on mobile than building
 * one from scratch. `loading={isCreating}` disables the button for the
 * duration of the submit, the same duplicate-submission guard every other
 * form in this app uses.
 */
export function AddTaskForm({ weddingId, milestones }: AddTaskFormProps) {
  const action = createTaskFormAction.bind(null, weddingId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  const milestoneOptions = milestones.map((milestone) => ({ value: milestone.id, label: milestone.title }));

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that task" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-task-title">Add a task</Label>
          <Input id="new-task-title" name="title" placeholder="e.g. Send save-the-dates" maxLength={150} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-task-priority">Priority</Label>
          <PrioritySelect id="new-task-priority" name="priority" defaultValue="medium" className="sm:w-48" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-task-due-date">Due date</Label>
          <DatePicker id="new-task-due-date" name="dueDate" className="sm:w-40" />
        </div>

        {milestoneOptions.length > 0 && (
          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <Label htmlFor="new-task-milestone">
              Milestone <span className="font-normal text-ink-faint">(optional)</span>
            </Label>
            <Select
              id="new-task-milestone"
              name="milestoneId"
              placeholder="No milestone"
              options={milestoneOptions}
              className="sm:w-64"
            />
          </div>
        )}

        <Button type="submit" loading={isCreating} className="sm:col-span-3 sm:w-auto sm:justify-self-start">
          Add task
        </Button>
      </form>
    </Card>
  );
}

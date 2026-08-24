"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, Label } from "@/components/ui";
import { Input } from "@/components/ui/form/input";

import { createImportantDateFormAction, type CreateImportantDateFormState } from "../actions";

const initialState: CreateImportantDateFormState = { status: "idle" };

interface AddDateFormProps {
  weddingId: string;
}

/** The timeline's quick-add row - title, date, and an optional time, the same "no dialog, always-visible inline form" pattern as `AddTaskForm`. */
export function AddDateForm({ weddingId }: AddDateFormProps) {
  const action = createImportantDateFormAction.bind(null, weddingId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that date" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-date-title">Add an important date</Label>
          <Input id="new-date-title" name="title" placeholder="e.g. Venue tour" maxLength={150} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-date-date">Date</Label>
          <DatePicker id="new-date-date" name="eventDate" required className="sm:w-44" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-date-time">
            Time <span className="font-normal text-ink-faint">(optional)</span>
          </Label>
          <Input id="new-date-time" name="eventTime" type="time" className="sm:w-32" />
        </div>
        <Button type="submit" loading={isCreating} className="sm:col-span-3 sm:w-auto sm:justify-self-start">
          Add date
        </Button>
      </form>
    </Card>
  );
}

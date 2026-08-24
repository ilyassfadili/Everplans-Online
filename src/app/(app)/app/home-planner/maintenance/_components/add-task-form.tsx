"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Stack } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { MaintenanceTaskFormFields } from "@/components/home-planner/maintenance-task-form-fields";

import { createMaintenanceTaskFormAction, type CreateMaintenanceTaskFormState } from "../actions";

const initialState: CreateMaintenanceTaskFormState = { status: "idle" };

interface AddTaskFormProps {
  homeId: string;
  roomOptions: SelectOption[];
}

/** The add-task form - `MaintenanceTaskFormFields` carries the actual field markup, shared with the edit form. On success, redirects into the new task's detail page (see `createMaintenanceTaskFormAction`). */
export function AddTaskForm({ homeId, roomOptions }: AddTaskFormProps) {
  const action = createMaintenanceTaskFormAction.bind(null, homeId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that task" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} noValidate>
        <Stack gap="4">
          <MaintenanceTaskFormFields roomOptions={roomOptions} />
          <Button type="submit" loading={isCreating} className="self-start">
            Add task
          </Button>
        </Stack>
      </form>
    </Card>
  );
}

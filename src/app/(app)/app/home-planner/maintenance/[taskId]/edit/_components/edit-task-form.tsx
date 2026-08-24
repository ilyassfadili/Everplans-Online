"use client";

import { useActionState } from "react";

import { Alert, Button, Stack } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { MaintenanceTaskFormFields } from "@/components/home-planner/maintenance-task-form-fields";
import type { MaintenanceTask } from "@/types/home-planner";

import { updateMaintenanceTaskFormAction, type UpdateMaintenanceTaskFormState } from "../../../actions";

const initialState: UpdateMaintenanceTaskFormState = { status: "idle" };

interface EditTaskFormProps {
  task: MaintenanceTask;
  roomOptions: SelectOption[];
}

/** The edit counterpart to `AddTaskForm` - same `MaintenanceTaskFormFields` markup, pre-filled with the task's current values, submitting to `updateMaintenanceTaskFormAction` bound to this task's id. */
export function EditTaskForm({ task, roomOptions }: EditTaskFormProps) {
  const action = updateMaintenanceTaskFormAction.bind(null, task.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "success" && (
          <Alert variant="success" title="Saved">
            This task has been updated.
          </Alert>
        )}
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t save your changes">
            {state.message}
          </Alert>
        )}

        <MaintenanceTaskFormFields
          roomOptions={roomOptions}
          defaultValues={{
            name: task.name,
            description: task.description,
            category: task.category,
            priority: task.priority,
            roomId: task.roomId,
            dueDate: task.dueDate,
            notes: task.notes,
            recurrenceFrequency: task.recurrenceFrequency,
            recurrenceIntervalDays: task.recurrenceIntervalDays,
          }}
        />

        <Button type="submit" loading={isPending} className="self-start">
          Save changes
        </Button>
      </Stack>
    </form>
  );
}

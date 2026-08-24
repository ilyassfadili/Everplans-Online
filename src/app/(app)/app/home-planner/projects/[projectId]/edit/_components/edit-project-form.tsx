"use client";

import { useActionState } from "react";

import { Alert, Button, Stack } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { ProjectFormFields } from "@/components/home-planner/project-form-fields";
import type { Project } from "@/types/home-planner";

import { updateProjectFormAction, type UpdateProjectFormState } from "../../../actions";

const initialState: UpdateProjectFormState = { status: "idle" };

interface EditProjectFormProps {
  project: Project;
  roomOptions: SelectOption[];
}

/** The edit counterpart to `CreateProjectForm` - same `ProjectFormFields` markup, pre-filled with the project's current values. */
export function EditProjectForm({ project, roomOptions }: EditProjectFormProps) {
  const action = updateProjectFormAction.bind(null, project.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "success" && (
          <Alert variant="success" title="Saved">
            This project has been updated.
          </Alert>
        )}
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t save your changes">
            {state.message}
          </Alert>
        )}

        <ProjectFormFields
          roomOptions={roomOptions}
          defaultValues={{
            name: project.name,
            description: project.description,
            category: project.category,
            status: project.status,
            roomId: project.roomId,
            startDate: project.startDate,
            targetCompletionDate: project.targetCompletionDate,
            budgetPlannedDollars: project.budgetPlannedCents !== null ? (project.budgetPlannedCents / 100).toFixed(2) : "",
            budgetUsedDollars: project.budgetUsedCents !== null ? (project.budgetUsedCents / 100).toFixed(2) : "",
            notes: project.notes,
          }}
        />

        <Button type="submit" loading={isPending} className="self-start">
          Save changes
        </Button>
      </Stack>
    </form>
  );
}

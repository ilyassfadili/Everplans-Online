"use client";

import { useActionState } from "react";

import { Alert, Button, Stack, Text } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { ProjectFormFields } from "@/components/home-planner/project-form-fields";

import { createProjectFormAction, type CreateProjectFormState } from "../../actions";

const initialState: CreateProjectFormState = { status: "idle" };

interface CreateProjectFormProps {
  homeId: string;
  roomOptions: SelectOption[];
}

/** The new-project form - `ProjectFormFields` carries the actual field markup, shared with the edit form. */
export function CreateProjectForm({ homeId, roomOptions }: CreateProjectFormProps) {
  const action = createProjectFormAction.bind(null, homeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t create that project">
            {state.message}
          </Alert>
        )}

        <ProjectFormFields roomOptions={roomOptions} />

        <div>
          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            Create project
          </Button>
          <Text size="body-sm" tone="faint" className="mt-3">
            You can edit or remove this project any time.
          </Text>
        </div>
      </Stack>
    </form>
  );
}

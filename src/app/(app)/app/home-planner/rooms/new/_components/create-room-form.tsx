"use client";

import { useActionState } from "react";

import { Alert, Button, Stack, Text } from "@/components/ui";
import { RoomFormFields } from "@/components/home-planner/room-form-fields";

import { createRoomFormAction, type CreateRoomFormState } from "../../actions";

const initialState: CreateRoomFormState = { status: "idle" };

interface CreateRoomFormProps {
  homeId: string;
}

/** The add-room form - `RoomFormFields` carries the actual field markup, shared with the edit form. */
export function CreateRoomForm({ homeId }: CreateRoomFormProps) {
  const action = createRoomFormAction.bind(null, homeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t add that room">
            {state.message}
          </Alert>
        )}

        <RoomFormFields />

        <div>
          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            Add room
          </Button>
          <Text size="body-sm" tone="faint" className="mt-3">
            You can edit or remove this room any time.
          </Text>
        </div>
      </Stack>
    </form>
  );
}

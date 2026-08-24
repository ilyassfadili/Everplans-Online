"use client";

import { useActionState } from "react";

import { Alert, Button, Stack } from "@/components/ui";
import { RoomFormFields } from "@/components/home-planner/room-form-fields";
import type { Room } from "@/types/home-planner";

import { updateRoomFormAction, type UpdateRoomFormState } from "../../../actions";

const initialState: UpdateRoomFormState = { status: "idle" };

interface EditRoomFormProps {
  room: Room;
}

/** The edit counterpart to `CreateRoomForm` - same `RoomFormFields` markup, pre-filled with the room's current values, submitting to `updateRoomFormAction` bound to this room's id. */
export function EditRoomForm({ room }: EditRoomFormProps) {
  const action = updateRoomFormAction.bind(null, room.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "success" && (
          <Alert variant="success" title="Saved">
            This room has been updated.
          </Alert>
        )}
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t save your changes">
            {state.message}
          </Alert>
        )}

        <RoomFormFields
          defaultValues={{
            name: room.name,
            roomType: room.roomType,
            description: room.description,
            notes: room.notes,
          }}
        />

        <Button type="submit" loading={isPending} className="self-start">
          Save changes
        </Button>
      </Stack>
    </form>
  );
}

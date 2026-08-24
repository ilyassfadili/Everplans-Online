"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Stack } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { InventoryItemFormFields } from "@/components/home-planner/inventory-item-form-fields";

import { createInventoryItemFormAction, type CreateInventoryItemFormState } from "../actions";

const initialState: CreateInventoryItemFormState = { status: "idle" };

interface AddItemFormProps {
  homeId: string;
  roomOptions: SelectOption[];
}

/** The add-item form - `InventoryItemFormFields` carries the actual field markup, shared with each row's inline edit form. */
export function AddItemForm({ homeId, roomOptions }: AddItemFormProps) {
  const action = createInventoryItemFormAction.bind(null, homeId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that item" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} noValidate>
        <Stack gap="4">
          <InventoryItemFormFields roomOptions={roomOptions} />
          <Button type="submit" loading={isCreating} className="self-start">
            Add item
          </Button>
        </Stack>
      </form>
    </Card>
  );
}

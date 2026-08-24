"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Stack } from "@/components/ui";
import { BillFormFields } from "@/components/home-planner/bill-form-fields";

import { createBillFormAction, type CreateBillFormState } from "../actions";

const initialState: CreateBillFormState = { status: "idle" };

interface AddBillFormProps {
  homeId: string;
}

/** The add-bill form - `BillFormFields` carries the actual field markup, shared with the edit form. */
export function AddBillForm({ homeId }: AddBillFormProps) {
  const action = createBillFormAction.bind(null, homeId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that bill" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} noValidate>
        <Stack gap="4">
          <BillFormFields />
          <Button type="submit" loading={isCreating} className="self-start">
            Add bill
          </Button>
        </Stack>
      </form>
    </Card>
  );
}

"use client";

import { useActionState } from "react";

import { Alert, Button, Stack } from "@/components/ui";
import { BillFormFields } from "@/components/home-planner/bill-form-fields";
import type { Bill } from "@/types/home-planner";

import { updateBillFormAction, type UpdateBillFormState } from "../../../actions";

const initialState: UpdateBillFormState = { status: "idle" };

interface EditBillFormProps {
  bill: Bill;
}

/** The edit counterpart to `AddBillForm` - same `BillFormFields` markup, pre-filled with the bill's current values, submitting to `updateBillFormAction` bound to this bill's id. */
export function EditBillForm({ bill }: EditBillFormProps) {
  const action = updateBillFormAction.bind(null, bill.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "success" && (
          <Alert variant="success" title="Saved">
            This bill has been updated.
          </Alert>
        )}
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t save your changes">
            {state.message}
          </Alert>
        )}

        <BillFormFields
          defaultValues={{
            name: bill.name,
            category: bill.category,
            amountDollars: (bill.amountCents / 100).toFixed(2),
            dueDate: bill.dueDate,
            notes: bill.notes,
            recurrenceFrequency: bill.recurrenceFrequency,
            recurrenceIntervalDays: bill.recurrenceIntervalDays,
          }}
        />

        <Button type="submit" loading={isPending} className="self-start">
          Save changes
        </Button>
      </Stack>
    </form>
  );
}

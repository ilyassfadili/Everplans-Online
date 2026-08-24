"use client";

import { useActionState } from "react";

import { Alert, Button, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";

import { createAccountFormAction, type CreateAccountFormState } from "../actions";
import { ACCOUNT_TYPE_OPTIONS } from "./account-types";

const initialState: CreateAccountFormState = { status: "idle" };

interface AddAccountFormProps {
  planId: string;
  onCancel: () => void;
}

/** The collapsible "add account" form - name (required) plus a type `<Select>` defaulting to Checking. Rendered only while the parent's "Add account" state is open. */
export function AddAccountForm({ planId, onCancel }: AddAccountFormProps) {
  const createAction = createAccountFormAction.bind(null, planId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
      {formState.status !== "idle" && (
        <Alert variant="error" title="Couldn't add that account">
          {formState.message}
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-account-name">Account name</Label>
          <Input id="new-account-name" name="name" placeholder="e.g. Chase Checking" maxLength={100} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-account-type">Type</Label>
          <Select id="new-account-type" name="type" defaultValue="checking" options={ACCOUNT_TYPE_OPTIONS} className="sm:w-40" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={isCreating}>
          Add account
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

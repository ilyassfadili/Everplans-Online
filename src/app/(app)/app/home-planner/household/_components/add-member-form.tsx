"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Label, Select } from "@/components/ui";
import { HOUSEHOLD_RELATIONSHIP_OPTIONS } from "@/components/home-planner/household-relationship-options";
import { Input } from "@/components/ui/form/input";

import { createHouseholdMemberFormAction, type CreateHouseholdMemberFormState } from "../actions";

const initialState: CreateHouseholdMemberFormState = { status: "idle" };

interface AddMemberFormProps {
  homeId: string;
}

/** Quick household member creation - name and relationship, the same "no dialog, always-visible inline form" pattern `AddGuestForm` (Wedding Planner) uses. */
export function AddMemberForm({ homeId }: AddMemberFormProps) {
  const action = createHouseholdMemberFormAction.bind(null, homeId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that household member" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-member-name">Name</Label>
          <Input id="new-member-name" name="name" placeholder="Jordan" maxLength={150} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-member-relationship">Relationship</Label>
          <Select id="new-member-relationship" name="relationship" options={HOUSEHOLD_RELATIONSHIP_OPTIONS} defaultValue="self" />
        </div>
        <Button type="submit" loading={isCreating} className="sm:w-auto">
          Add member
        </Button>
      </form>
    </Card>
  );
}

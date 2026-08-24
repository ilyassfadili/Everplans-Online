"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Label } from "@/components/ui";
import { Input } from "@/components/ui/form/input";

import { createGuestFormAction, type CreateGuestFormState } from "../actions";

const initialState: CreateGuestFormState = { status: "idle" };

interface AddGuestFormProps {
  weddingId: string;
}

/** Quick guest creation - first/last name and an optional group, the same "no dialog, always-visible inline form" pattern every other quick-add in this feature uses. */
export function AddGuestForm({ weddingId }: AddGuestFormProps) {
  const action = createGuestFormAction.bind(null, weddingId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that guest" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-guest-first-name">First name</Label>
          <Input id="new-guest-first-name" name="firstName" placeholder="Jordan" maxLength={100} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-guest-last-name">Last name</Label>
          <Input id="new-guest-last-name" name="lastName" placeholder="Rivera" maxLength={100} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-guest-group">
            Group <span className="font-normal text-ink-faint">(optional)</span>
          </Label>
          <Input id="new-guest-group" name="groupLabel" placeholder="e.g. Family" maxLength={100} />
        </div>
        <Button type="submit" loading={isCreating} className="sm:w-auto">
          Add guest
        </Button>
      </form>
    </Card>
  );
}

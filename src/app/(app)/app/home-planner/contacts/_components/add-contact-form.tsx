"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Label, Select } from "@/components/ui";
import { HOME_CONTACT_ROLE_OPTIONS } from "@/components/home-planner/home-contact-role-options";
import { Input } from "@/components/ui/form/input";

import { createContactFormAction, type CreateHomeContactFormState } from "../actions";

const initialState: CreateHomeContactFormState = { status: "idle" };

interface AddContactFormProps {
  homeId: string;
}

/** Quick contact creation - name, role, and optional phone/email, the same "no dialog, always-visible inline form" pattern `AddGuestForm` (Wedding Planner) uses. */
export function AddContactForm({ homeId }: AddContactFormProps) {
  const action = createContactFormAction.bind(null, homeId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that contact" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-contact-name">Name</Label>
          <Input id="new-contact-name" name="name" placeholder="Jordan Rivera" maxLength={150} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-contact-role">Role</Label>
          <Select id="new-contact-role" name="role" options={HOME_CONTACT_ROLE_OPTIONS} defaultValue="other" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-contact-phone">
            Phone <span className="font-normal text-ink-faint">(optional)</span>
          </Label>
          <Input id="new-contact-phone" name="phone" type="tel" maxLength={32} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-contact-email">
            Email <span className="font-normal text-ink-faint">(optional)</span>
          </Label>
          <Input id="new-contact-email" name="email" type="email" maxLength={254} />
        </div>
        <Button type="submit" loading={isCreating} className="sm:w-auto">
          Add contact
        </Button>
      </form>
    </Card>
  );
}

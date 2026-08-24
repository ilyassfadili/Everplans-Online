"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";

import { Button, Card, Heading, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { EmergencyContactInput, EmergencyContactMutationResult } from "@/lib/travel/emergency-contacts";
import type { EmergencyContact } from "@/types/travel";

import { createEmergencyContactAction, deleteEmergencyContactAction, updateEmergencyContactAction } from "../actions";
import { EmergencyContactRow } from "./emergency-contact-row";

interface EmergencyContactsCardProps {
  tripId: string;
  contacts: EmergencyContact[];
}

function AddContactForm({ onAdd }: { onAdd: (input: EmergencyContactInput) => Promise<EmergencyContactMutationResult> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await onAdd({
      name: formData.get("name")?.toString() ?? "",
      relationship: formData.get("relationship")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      email: formData.get("email")?.toString() || undefined,
      notes: formData.get("notes")?.toString() || undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsOpen(false);
    } else {
      setError(result.message ?? "Couldn't add that contact.");
    }
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="ghost" size="sm" leadingIcon={<Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />} onClick={() => setIsOpen(true)}>
        Add contact
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" maxLength={150} aria-label="Contact name" placeholder="Name" required autoFocus />
        <Input name="relationship" maxLength={100} aria-label="Relationship" placeholder="Relationship" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="phone" type="tel" maxLength={50} aria-label="Phone" placeholder="Phone" required />
        <Input name="email" type="email" maxLength={254} aria-label="Email (optional)" placeholder="Email (optional)" />
      </div>
      <Textarea name="notes" maxLength={500} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={isSaving}>
          Add contact
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Emergency contacts (Phase 3) - the one genuinely new record type this page introduces. */
export function EmergencyContactsCard({ tripId, contacts }: EmergencyContactsCardProps) {
  async function handleAdd(input: EmergencyContactInput): Promise<EmergencyContactMutationResult> {
    return createEmergencyContactAction(tripId, input);
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center gap-2.5">
        <Users className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
        <Heading as="h2" size="h4">
          Emergency Contacts
        </Heading>
      </div>
      {contacts.length === 0 ? (
        <Text size="body-sm" tone="muted" className="mt-2">
          Add anyone you’d want reached in an emergency.
        </Text>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-line-subtle">
          {contacts.map((contact) => (
            <EmergencyContactRow key={contact.id} contact={contact} onSave={updateEmergencyContactAction} onDelete={deleteEmergencyContactAction} />
          ))}
        </ul>
      )}
      <div className="mt-3">
        <AddContactForm onAdd={handleAdd} />
      </div>
    </Card>
  );
}

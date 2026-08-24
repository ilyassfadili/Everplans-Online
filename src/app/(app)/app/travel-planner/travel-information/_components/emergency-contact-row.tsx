"use client";

import { useState } from "react";
import { Mail, Pencil, Phone, Trash2 } from "lucide-react";

import { Button, Icon, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { DeleteEmergencyContactResult, EmergencyContactInput, EmergencyContactMutationResult } from "@/lib/travel/emergency-contacts";
import type { EmergencyContact } from "@/types/travel";

interface EmergencyContactRowProps {
  contact: EmergencyContact;
  onSave: (contactId: string, input: EmergencyContactInput) => Promise<EmergencyContactMutationResult>;
  onDelete: (contactId: string) => Promise<DeleteEmergencyContactResult>;
}

/** One emergency contact - name, relationship, phone, optional email/notes, editable/deletable inline. */
export function EmergencyContactRow({ contact, onSave, onDelete }: EmergencyContactRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await onSave(contact.id, {
      name: formData.get("name")?.toString() ?? "",
      relationship: formData.get("relationship")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      email: formData.get("email")?.toString() || undefined,
      notes: formData.get("notes")?.toString() || undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that contact.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${contact.name}" from your emergency contacts?`)) return;
    setIsDeleting(true);
    const result = await onDelete(contact.id);
    if (result.status !== "success") {
      setIsDeleting(false);
      setError(result.message ?? "Couldn't remove that contact.");
    }
  }

  if (isEditing) {
    return (
      <li className="rounded-md border border-line bg-surface-muted/40 p-4">
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" defaultValue={contact.name} maxLength={150} aria-label="Contact name" required />
            <Input name="relationship" defaultValue={contact.relationship} maxLength={100} aria-label="Relationship" placeholder="Relationship" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="phone" type="tel" defaultValue={contact.phone} maxLength={50} aria-label="Phone" required />
            <Input name="email" type="email" defaultValue={contact.email ?? ""} maxLength={254} aria-label="Email (optional)" placeholder="Email (optional)" />
          </div>
          <Textarea name="notes" defaultValue={contact.notes ?? ""} maxLength={500} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <Text size="body-sm" weight="medium" className="text-ink">
          {contact.name} <span className="font-normal text-ink-faint">· {contact.relationship}</span>
        </Text>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <Phone className="size-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
            <Text size="body-sm" tone="muted">
              {contact.phone}
            </Text>
          </div>
          {contact.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="size-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
              <Text size="body-sm" tone="muted">
                {contact.email}
              </Text>
            </div>
          )}
        </div>
        {contact.notes && (
          <Text size="body-sm" tone="muted" className="mt-1">
            {contact.notes}
          </Text>
        )}
        {error && (
          <Text size="body-sm" tone="error" className="mt-1">
            {error}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${contact.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Remove "${contact.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

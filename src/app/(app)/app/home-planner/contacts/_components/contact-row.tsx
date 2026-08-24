"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Text } from "@/components/ui";
import {
  getHomeContactRoleLabel,
  HOME_CONTACT_ROLE_OPTIONS,
} from "@/components/home-planner/home-contact-role-options";
import { Input } from "@/components/ui/form/input";
import { Select } from "@/components/ui/form/select";
import type { HomeContact, HomeContactRole } from "@/types/home-planner";

import { editContactAction, removeContactAction } from "../actions";

interface ContactRowProps {
  contact: HomeContact;
}

/** One important contact - the same "inline-form toggle" editing pattern `GuestRow` (Wedding Planner) and `MemberRow` (Household) establish. */
export function ContactRow({ contact }: ContactRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const role = formData.get("role");
    const phone = formData.get("phone");
    const email = formData.get("email");

    setIsSaving(true);
    const result = await editContactAction(contact.id, {
      name: typeof name === "string" ? name : undefined,
      role: typeof role === "string" ? (role as HomeContactRole) : undefined,
      phone: typeof phone === "string" ? phone : "",
      email: typeof email === "string" ? email : "",
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleDelete() {
    if (window.confirm(`Remove ${contact.name} from your contacts?`)) {
      void removeContactAction(contact.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" defaultValue={contact.name} maxLength={150} aria-label="Name" required />
            <Select name="role" defaultValue={contact.role} options={HOME_CONTACT_ROLE_OPTIONS} aria-label="Role" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="phone" type="tel" defaultValue={contact.phone ?? ""} aria-label="Phone (optional)" placeholder="Phone" />
            <Input name="email" type="email" defaultValue={contact.email ?? ""} aria-label="Email (optional)" placeholder="Email" />
          </div>
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
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Text size="body" weight="medium" className="text-ink">
            {contact.name}
          </Text>
          <Badge variant="neutral">{getHomeContactRoleLabel(contact.role)}</Badge>
        </div>
        {(contact.phone || contact.email) && (
          <Text size="body-sm" tone="muted" className="mt-1">
            {[contact.phone, contact.email].filter(Boolean).join(" · ")}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${contact.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove ${contact.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { WeddingGuest, WeddingGuestRsvpStatus } from "@/types/wedding";

import { editGuestAction, removeGuestAction } from "../actions";

const RSVP_OPTIONS: { value: WeddingGuestRsvpStatus; label: string }[] = [
  { value: "not-responded", label: "Not responded" },
  { value: "attending", label: "Attending" },
  { value: "not-attending", label: "Not attending" },
];

interface GuestRowProps {
  guest: WeddingGuest;
}

/**
 * One guest - RSVP status is a `Select` that saves the instant it changes
 * (Phase 2: "the interaction should be lightweight," the same "save
 * automatically for simple preferences" pattern `PreferencesForm` uses),
 * everything else edits through the same inline-form toggle every other
 * row in this feature uses.
 */
export function GuestRow({ guest }: GuestRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingRsvp, startRsvpTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRsvpChange(value: string) {
    startRsvpTransition(() => {
      void editGuestAction(guest.id, { rsvpStatus: value as WeddingGuestRsvpStatus });
    });
  }

  async function handleSave(formData: FormData) {
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const groupLabel = formData.get("groupLabel");

    setIsSaving(true);
    const result = await editGuestAction(guest.id, {
      firstName: typeof firstName === "string" ? firstName : undefined,
      lastName: typeof lastName === "string" ? lastName : undefined,
      email: typeof email === "string" ? email : "",
      phone: typeof phone === "string" ? phone : "",
      groupLabel: typeof groupLabel === "string" ? groupLabel : "",
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
    if (window.confirm(`Remove ${guest.firstName} ${guest.lastName} from your guest list?`)) {
      void removeGuestAction(guest.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="firstName" defaultValue={guest.firstName} maxLength={100} aria-label="First name" required />
            <Input name="lastName" defaultValue={guest.lastName} maxLength={100} aria-label="Last name" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="email" type="email" defaultValue={guest.email ?? ""} aria-label="Email (optional)" placeholder="Email" />
            <Input name="phone" type="tel" defaultValue={guest.phone ?? ""} aria-label="Phone (optional)" placeholder="Phone" />
          </div>
          <Input name="groupLabel" defaultValue={guest.groupLabel ?? ""} maxLength={100} aria-label="Group (optional)" placeholder="Group, e.g. Family" />
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
            {guest.firstName} {guest.lastName}
          </Text>
          {guest.groupLabel && <Badge variant="neutral">{guest.groupLabel}</Badge>}
        </div>
        {(guest.email || guest.phone) && (
          <Text size="body-sm" tone="muted" className="mt-1">
            {[guest.email, guest.phone].filter(Boolean).join(" · ")}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Select
          aria-label={`RSVP status for ${guest.firstName} ${guest.lastName}`}
          value={guest.rsvpStatus}
          onValueChange={handleRsvpChange}
          disabled={isChangingRsvp}
          options={RSVP_OPTIONS}
          className="w-40"
        />
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${guest.firstName} ${guest.lastName}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove ${guest.firstName} ${guest.lastName}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

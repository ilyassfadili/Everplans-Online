"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Text } from "@/components/ui";
import {
  getHouseholdRelationshipLabel,
  HOUSEHOLD_RELATIONSHIP_OPTIONS,
} from "@/components/home-planner/household-relationship-options";
import { Input } from "@/components/ui/form/input";
import { Select } from "@/components/ui/form/select";
import type { HouseholdMember, HouseholdRelationship } from "@/types/home-planner";

import { editHouseholdMemberAction, removeHouseholdMemberAction } from "../actions";

interface MemberRowProps {
  member: HouseholdMember;
}

/** One household member - the same "inline-form toggle" editing pattern `GuestRow` (Wedding Planner) establishes. */
export function MemberRow({ member }: MemberRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const relationship = formData.get("relationship");

    setIsSaving(true);
    const result = await editHouseholdMemberAction(member.id, {
      name: typeof name === "string" ? name : undefined,
      relationship: typeof relationship === "string" ? (relationship as HouseholdRelationship) : undefined,
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
    if (window.confirm(`Remove ${member.name} from your household?`)) {
      void removeHouseholdMemberAction(member.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" defaultValue={member.name} maxLength={150} aria-label="Name" required />
            <Select
              name="relationship"
              defaultValue={member.relationship}
              options={HOUSEHOLD_RELATIONSHIP_OPTIONS}
              aria-label="Relationship"
            />
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
            {member.name}
          </Text>
          <Badge variant="neutral">{getHouseholdRelationshipLabel(member.relationship)}</Badge>
        </div>
        {member.notes && (
          <Text size="body-sm" tone="muted" className="mt-1">
            {member.notes}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${member.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove ${member.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

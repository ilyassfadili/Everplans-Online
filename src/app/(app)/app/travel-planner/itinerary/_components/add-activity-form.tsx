"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { ACTIVITY_CATEGORY_OPTIONS } from "@/components/travel/activity-category-options";
import type { ActivityInput, ActivityMutationResult } from "@/lib/travel/activities";

interface AddActivityFormProps {
  onAdd: (input: ActivityInput) => Promise<ActivityMutationResult>;
}

/**
 * "+ Add activity" - collapsed by default (Phase 2 §9: "the user should be
 * able to add an activity quickly without feeling overwhelmed"). A trip
 * can span many days, so showing every day's add-activity form open at
 * once (the always-visible pattern `AddDateForm` uses for Wedding's single
 * timeline) would be a wall of forms here; one toggle per day keeps each
 * day calm until the traveler actually wants to add something.
 */
export function AddActivityForm({ onAdd }: AddActivityFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const title = formData.get("title");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const location = formData.get("location");
    const category = formData.get("category");
    const notes = formData.get("notes");

    const result = await onAdd({
      title: typeof title === "string" ? title : "",
      startTime: typeof startTime === "string" ? startTime : undefined,
      endTime: typeof endTime === "string" ? endTime : undefined,
      location: typeof location === "string" ? location : undefined,
      category: (typeof category === "string" ? category : "other") as ActivityInput["category"],
      notes: typeof notes === "string" ? notes : undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsOpen(false);
    } else {
      setError(result.message ?? "Couldn't add that activity.");
    }
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="ghost" size="sm" leadingIcon={<Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />} onClick={() => setIsOpen(true)}>
        Add activity
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
      <Input name="title" maxLength={150} aria-label="Activity title" placeholder="e.g. Walking tour of the old town" required autoFocus />
      <div className="grid gap-3 sm:grid-cols-3">
        <Input name="startTime" type="time" aria-label="Start time (optional)" />
        <Input name="endTime" type="time" aria-label="End time (optional)" />
        <Select name="category" options={ACTIVITY_CATEGORY_OPTIONS} defaultValue="sightseeing" aria-label="Category" />
      </div>
      <Input name="location" maxLength={200} aria-label="Location (optional)" placeholder="Location (optional)" />
      <Textarea name="notes" maxLength={1000} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={isSaving}>
          Add activity
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

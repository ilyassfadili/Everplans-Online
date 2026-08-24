"use client";

import { useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { ACTIVITY_CATEGORY_OPTIONS, getActivityCategoryLabel } from "@/components/travel/activity-category-options";
import { formatActivityTime } from "@/lib/travel/format";
import type { ActivityInput, ActivityMutationResult, DeleteActivityResult } from "@/lib/travel/activities";
import type { Activity } from "@/types/travel";

interface ActivityRowProps {
  activity: Activity;
  onSave: (activityId: string, input: ActivityInput) => Promise<ActivityMutationResult>;
  onDelete: (activityId: string) => Promise<DeleteActivityResult>;
}

function formatTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null;
  return endTime ? `${formatActivityTime(startTime)} - ${formatActivityTime(endTime)}` : formatActivityTime(startTime);
}

/**
 * One activity within an itinerary day - view mode shows time, title,
 * category, location, and notes at a glance; edit mode replaces it with
 * the same field set `AddActivityForm` uses. Same "click Edit, form
 * replaces the row, Save/Cancel" interaction `TimelineEntryRow` and
 * `ItineraryDayCard` already establish, applied one level deeper.
 */
export function ActivityRow({ activity, onSave, onDelete }: ActivityRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const title = formData.get("title");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const location = formData.get("location");
    const category = formData.get("category");
    const notes = formData.get("notes");

    const result = await onSave(activity.id, {
      title: typeof title === "string" ? title : "",
      startTime: typeof startTime === "string" ? startTime : undefined,
      endTime: typeof endTime === "string" ? endTime : undefined,
      location: typeof location === "string" ? location : undefined,
      category: (typeof category === "string" ? category : "other") as Activity["category"],
      notes: typeof notes === "string" ? notes : undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that activity.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${activity.title}" from this day?`)) return;
    setIsDeleting(true);
    const result = await onDelete(activity.id);
    if (result.status !== "success") {
      setIsDeleting(false);
      setError(result.message ?? "Couldn't remove that activity.");
    }
  }

  if (isEditing) {
    return (
      <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
        <Input name="title" defaultValue={activity.title} maxLength={150} aria-label="Activity title" required />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input name="startTime" type="time" defaultValue={activity.startTime ?? ""} aria-label="Start time (optional)" />
          <Input name="endTime" type="time" defaultValue={activity.endTime ?? ""} aria-label="End time (optional)" />
          <Select name="category" options={ACTIVITY_CATEGORY_OPTIONS} defaultValue={activity.category} aria-label="Category" />
        </div>
        <Input name="location" defaultValue={activity.location ?? ""} maxLength={200} aria-label="Location (optional)" placeholder="Location (optional)" />
        <Textarea name="notes" defaultValue={activity.notes ?? ""} maxLength={1000} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
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
    );
  }

  const timeRange = formatTimeRange(activity.startTime, activity.endTime);

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-line-subtle bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {timeRange && (
            <Text size="body-sm" weight="semibold" className="tabular-nums text-ink">
              {timeRange}
            </Text>
          )}
          <Text size="body-sm" weight="medium" className="text-ink">
            {activity.title}
          </Text>
          <Badge variant="outline">{getActivityCategoryLabel(activity.category)}</Badge>
        </div>
        {activity.location && (
          <div className="mt-1 flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
            <Text size="body-sm" tone="muted">
              {activity.location}
            </Text>
          </div>
        )}
        {activity.notes && (
          <Text size="body-sm" tone="muted" className="mt-1 whitespace-pre-wrap">
            {activity.notes}
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
          aria-label={`Edit "${activity.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Remove "${activity.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </div>
  );
}

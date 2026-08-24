"use client";

import { useState } from "react";
import { CalendarDays, Heart, Pencil, Trash2 } from "lucide-react";

import { Badge, Button, DatePicker, Icon, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { ImportantDateMutationResult, UpdateImportantDateInput } from "@/lib/wedding/important-dates";
import { getTimelineStatus } from "@/lib/wedding/timeline";
import type { CreateWeddingResult } from "@/lib/wedding/weddings";
import type { TimelineEntry } from "@/types/wedding";

const STATUS_LABEL = { past: "Past", today: "Today", upcoming: "Upcoming" } as const;
// Calm, not alarming (Phase 1: "do not make overdue/past information
// unnecessarily alarming") - past events fade to neutral, they don't turn
// warning/error colors.
const STATUS_VARIANT = { past: "neutral", today: "brand", upcoming: "outline" } as const;

function formatEntryDate(eventDate: string, eventTime: string | null): string {
  const date = new Date(`${eventDate}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  if (!eventTime) return dateLabel;

  const [hours, minutes] = eventTime.split(":").map(Number);
  const timeLabel = new Date(0, 0, 0, hours, minutes).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} · ${timeLabel}`;
}

interface TimelineEntryRowProps {
  entry: TimelineEntry;
  onSave: (id: string, input: UpdateImportantDateInput) => Promise<ImportantDateMutationResult>;
  onDelete?: (id: string) => void;
  onSaveWeddingDate?: (eventDate: string) => Promise<CreateWeddingResult>;
}

/**
 * One timeline entry - a user-created important date, the wedding date
 * itself, or a wedding event (`entry.kind`). The wedding date gets no
 * delete control (it can only be changed, never removed - it's the
 * workspace's own foundational date) and saves through `onSaveWeddingDate`
 * instead of the regular important-date update path. An event entry is
 * read-only here entirely - editing an event happens on its own detail
 * page (Prompt 5), so this row only links there rather than duplicating
 * that form inline.
 */
export function TimelineEntryRow({ entry, onSave, onDelete, onSaveWeddingDate }: TimelineEntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = getTimelineStatus(entry.eventDate);
  const isWeddingDate = entry.kind === "wedding-date";
  const isEvent = entry.kind === "event";

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    if (isWeddingDate) {
      const eventDate = formData.get("eventDate");
      const result = await onSaveWeddingDate?.(typeof eventDate === "string" ? eventDate : "");
      setIsSaving(false);
      if (result?.status === "success") {
        setIsEditing(false);
      } else {
        setError(result?.message ?? "Couldn't save that date.");
      }
      return;
    }

    const title = formData.get("title");
    const eventDate = formData.get("eventDate");
    const eventTime = formData.get("eventTime");
    const result = await onSave(entry.id, {
      title: typeof title === "string" ? title : undefined,
      eventDate: typeof eventDate === "string" ? eventDate : undefined,
      eventTime: typeof eventTime === "string" ? eventTime : "",
    });
    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  if (isEditing) {
    return (
      <li className="flex gap-4 py-4">
        <div className="w-1 shrink-0 rounded-full bg-line-subtle" />
        <form action={handleSave} className="flex min-w-0 flex-1 flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          {!isWeddingDate && (
            <Input name="title" defaultValue={entry.title} maxLength={150} aria-label="Title" required />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker name="eventDate" defaultValue={entry.eventDate} aria-label="Date" required />
            {!isWeddingDate && (
              <Input name="eventTime" type="time" defaultValue={entry.eventTime ?? ""} aria-label="Time (optional)" />
            )}
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
    <li className="flex gap-4 py-4">
      <div className={`w-1 shrink-0 rounded-full ${status === "past" ? "bg-line-subtle" : "bg-brand"}`} />
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isWeddingDate && <Icon icon={Heart} size="sm" className="text-brand" />}
            {isEvent && <Icon icon={CalendarDays} size="sm" className="text-brand" />}
            <Text size="body" weight="medium" className={status === "past" ? "text-ink-faint" : "text-ink"}>
              {entry.title}
            </Text>
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
            {isEvent && <Badge variant="outline">Event</Badge>}
          </div>
          <Text size="body-sm" tone="muted" className="mt-1">
            {formatEntryDate(entry.eventDate, entry.eventTime)}
          </Text>
          {entry.description && (
            <Text size="body-sm" tone="muted" className="mt-1">
              {entry.description}
            </Text>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isEvent ? (
            <Button href={`/app/wedding-planner/events/${entry.id}`} variant="ghost" size="sm">
              View event
            </Button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                aria-label={`Edit "${entry.title}"`}
                className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Icon icon={Pencil} size="sm" />
              </button>
              {!isWeddingDate && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  aria-label={`Remove "${entry.title}"`}
                  className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <Icon icon={Trash2} size="sm" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

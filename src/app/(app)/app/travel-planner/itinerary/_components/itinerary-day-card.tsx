"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Badge, Button, Card, Icon, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatItineraryDayDate } from "@/lib/travel/format";
import type { ActivityInput, ActivityMutationResult, DeleteActivityResult } from "@/lib/travel/activities";
import type { ItineraryDay } from "@/types/travel";
import type { TripDayMutationResult } from "@/lib/travel/itinerary";

import { AddActivityForm } from "./add-activity-form";
import { DayTimeline } from "./day-timeline";

interface ItineraryDayCardProps {
  day: ItineraryDay;
  isToday: boolean;
  onSaveDay: (dayDate: string, input: { title?: string; notes?: string }) => Promise<TripDayMutationResult>;
  onAddActivity: (input: ActivityInput) => Promise<ActivityMutationResult>;
  onSaveActivity: (activityId: string, input: ActivityInput) => Promise<ActivityMutationResult>;
  onDeleteActivity: (activityId: string) => Promise<DeleteActivityResult>;
}

/**
 * One itinerary day - "Day N", its date, an optional title/notes the
 * traveler can add or edit inline (Prompt 2 Phase 1), and its activities as
 * a real chronological timeline (Phase 2 CRUD, Phase 3 presentation - see
 * `DayTimeline`) plus an "Add activity" toggle.
 *
 * No delete control on the day itself: a day is a calendar unit derived
 * from the trip's own dates (`buildItineraryDays`'s own comment), not a
 * freely creatable/removable item - only its optional title/notes can be
 * cleared, by saving them blank.
 */
export function ItineraryDayCard({ day, isToday, onSaveDay, onAddActivity, onSaveActivity, onDeleteActivity }: ItineraryDayCardProps) {
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveDay(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const title = formData.get("title");
    const notes = formData.get("notes");
    const result = await onSaveDay(day.date, {
      title: typeof title === "string" ? title : undefined,
      notes: typeof notes === "string" ? notes : undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsEditingDay(false);
    } else {
      setError(result.message ?? "Couldn't save that day.");
    }
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Text size="body-sm" weight="semibold" className="text-ink">
            Day {day.dayNumber}
          </Text>
          <Text size="body-sm" tone="muted">
            {formatItineraryDayDate(day.date)}
          </Text>
          {isToday && <Badge variant="brand">Today</Badge>}
        </div>
        {!isEditingDay && (
          <button
            type="button"
            onClick={() => setIsEditingDay(true)}
            aria-label={`Edit Day ${day.dayNumber}`}
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Icon icon={Pencil} size="sm" />
          </button>
        )}
      </div>

      {isEditingDay ? (
        <form action={handleSaveDay} className="mt-4 flex flex-col gap-3">
          <Input name="title" defaultValue={day.tripDay?.title ?? ""} maxLength={150} aria-label="Day title (optional)" placeholder="e.g. Old town and harbor" />
          <Textarea
            name="notes"
            defaultValue={day.tripDay?.notes ?? ""}
            maxLength={1000}
            rows={3}
            aria-label="Day notes (optional)"
            placeholder="Anything worth remembering about this day..."
          />
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingDay(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-3">
          {day.tripDay?.title && (
            <Text size="body" weight="medium" className="text-ink">
              {day.tripDay.title}
            </Text>
          )}
          {day.tripDay?.notes && (
            <Text size="body-sm" tone="muted" className="mt-1 whitespace-pre-wrap">
              {day.tripDay.notes}
            </Text>
          )}
          {!day.tripDay?.title && !day.tripDay?.notes && (
            <Text size="body-sm" tone="faint">
              Nothing planned yet.
            </Text>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
        {day.activities.length > 0 ? (
          <DayTimeline activities={day.activities} onSaveActivity={onSaveActivity} onDeleteActivity={onDeleteActivity} />
        ) : (
          <Text size="body-sm" tone="faint">
            No activities planned yet.
          </Text>
        )}
        <AddActivityForm onAdd={onAddActivity} />
      </div>
    </Card>
  );
}

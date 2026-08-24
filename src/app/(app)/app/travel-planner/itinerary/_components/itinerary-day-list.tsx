"use client";

import { Stack } from "@/components/ui";
import type { ActivityInput } from "@/lib/travel/activities";
import type { ItineraryDay } from "@/types/travel";

import { createActivityAction, deleteActivityAction, saveTripDayAction, updateActivityAction } from "../actions";
import { ItineraryDayCard } from "./itinerary-day-card";

interface ItineraryDayListProps {
  tripId: string;
  days: ItineraryDay[];
  todayDate: string | null;
}

/**
 * The itinerary's day-by-day list - one `ItineraryDayCard` per calendar
 * day the trip spans. A thin Client Component wrapper whose only job is
 * binding `tripId` (and, for adding an activity, each card's own `dayDate`)
 * into the Server Actions once, so every card gets ready-to-call
 * `onSave*`/`onAddActivity` props instead of threading `tripId` through
 * each card's own call sites.
 */
export function ItineraryDayList({ tripId, days, todayDate }: ItineraryDayListProps) {
  async function handleSaveDay(dayDate: string, input: { title?: string; notes?: string }) {
    return saveTripDayAction(tripId, dayDate, input);
  }

  return (
    <Stack gap="4">
      {days.map((day) => (
        <ItineraryDayCard
          key={day.date}
          day={day}
          isToday={day.date === todayDate}
          onSaveDay={handleSaveDay}
          onAddActivity={(input: ActivityInput) => createActivityAction(tripId, day.date, input)}
          onSaveActivity={updateActivityAction}
          onDeleteActivity={deleteActivityAction}
        />
      ))}
    </Stack>
  );
}

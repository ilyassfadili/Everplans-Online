import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";

import { Container, EmptyState } from "@/components/ui";
import { getActivitiesForTripDayIds } from "@/lib/travel/activities";
import { buildItineraryDays, getTripDaysForTrip } from "@/lib/travel/itinerary";
import { requireTripForCurrentUser } from "@/lib/travel/trips";

import { PageHeader } from "../../_components/page-header";
import { ItineraryDayList } from "./_components/itinerary-day-list";

export const metadata: Metadata = {
  title: "Itinerary",
  robots: { index: false, follow: false },
};

/** Today's date as plain `YYYY-MM-DD`, for highlighting the current day in the list - computed at request time, never stored. */
function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The Travel Planner itinerary (Everplans Travel Planner Prompt 2 Phase 1)
 * - every calendar day the trip spans, each with an optional title/notes
 * the traveler can fill in. Gated the same way every Travel Planner route
 * is: no trip yet redirects to trip setup.
 *
 * `buildItineraryDays` is what makes this "derive correctly from the trip
 * dates" (Phase 1 §4): the day list always reflects the trip's *current*
 * `startDate`/`endDate`, so editing trip dates on `/app/travel-planner/edit`
 * changes what shows up here automatically, with nothing to keep in sync
 * by hand. Each day's activities (Phase 2) are fetched in one query across
 * every `trip_days` row this trip has, then grouped back onto their day -
 * not one query per day.
 */
export default async function ItineraryPage() {
  const trip = await requireTripForCurrentUser();

  const tripDays = await getTripDaysForTrip(trip.id);
  const activities = await getActivitiesForTripDayIds(tripDays.map((tripDay) => tripDay.id));
  const days = buildItineraryDays(trip, tripDays, activities);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Itinerary" description="Your trip, day by day." />

      {days.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No days to show yet"
          description="Set your trip dates to see your itinerary laid out day by day."
        />
      ) : (
        <ItineraryDayList tripId={trip.id} days={days} todayDate={getTodayDate()} />
      )}
    </Container>
  );
}

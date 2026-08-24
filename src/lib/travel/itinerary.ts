import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Activity, ItineraryDay, Trip, TripDay } from "@/types/travel";

import { enumerateTripDates } from "./format";

/**
 * The Travel Planner's itinerary data-access layer (Prompt 2 Phase 1) -
 * `public.trip_days`. Same shape as `@/lib/wedding/important-dates`: every
 * exported function calls `requireUser()` itself, and RLS (a join back to
 * `trips.owner_id`) independently enforces "only this trip's owner."
 *
 * `server-only`: reads/writes `public.trip_days` through the server
 * Supabase client. Never safe to import from a Client Component.
 */

const TRIP_DAY_COLUMNS = "id, trip_id, day_date, title, notes, created_at, updated_at";

type TripDayRow = {
  id: string;
  trip_id: string;
  day_date: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapTripDayRow(row: TripDayRow): TripDay {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayDate: row.day_date,
    title: row.title,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every `trip_days` row a trip actually has - not one per calendar day (see `buildItineraryDays`). */
export async function getTripDaysForTrip(tripId: string): Promise<TripDay[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_days")
    .select(TRIP_DAY_COLUMNS)
    .eq("trip_id", tripId)
    .order("day_date", { ascending: true });

  if (error) {
    console.error("getTripDaysForTrip: failed to load trip days", error);
    return [];
  }

  return (data ?? []).map(mapTripDayRow);
}

/**
 * Merges a trip's real date range with whatever `trip_days` rows already
 * exist - the itinerary's actual day-by-day list (Phase 1 §4: "the
 * itinerary must derive correctly from the trip dates"). A day outside the
 * trip's current range never appears, even if an old `trip_days` row still
 * exists for it (e.g. the trip was shortened after that day was
 * customized) - the trip's own dates are always the source of truth for
 * which days exist; a stale row is simply orphaned data, not deleted or
 * migrated, since Phase 1 doesn't need anything more than "don't show it."
 */
export function buildItineraryDays(trip: Trip, tripDays: TripDay[], activities: Activity[] = []): ItineraryDay[] {
  const tripDayByDate = new Map(tripDays.map((day) => [day.dayDate, day]));
  const activitiesByTripDayId = new Map<string, Activity[]>();
  for (const activity of activities) {
    const list = activitiesByTripDayId.get(activity.tripDayId);
    if (list) {
      list.push(activity);
    } else {
      activitiesByTripDayId.set(activity.tripDayId, [activity]);
    }
  }

  return enumerateTripDates(trip.startDate, trip.endDate).map((date, index) => {
    const tripDay = tripDayByDate.get(date) ?? null;
    return {
      date,
      dayNumber: index + 1,
      tripDay,
      activities: tripDay ? (activitiesByTripDayId.get(tripDay.id) ?? []) : [],
    };
  });
}

/**
 * Returns the `trip_days` row for one calendar date, creating an empty one
 * (no title/notes) if it doesn't exist yet - what adding an activity to an
 * uncustomized day needs (`createActivity`, `@/lib/travel/activities`),
 * since an activity's `trip_day_id` foreign key requires a real row to
 * point at. Never overwrites an existing row's title/notes - unlike
 * `upsertTripDay`, this only ever inserts when nothing is there yet, so it
 * can't accidentally blank out content a traveler already added.
 */
export async function ensureTripDay(tripId: string, dayDate: string): Promise<TripDay | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: selectError } = await supabase
    .from("trip_days")
    .select(TRIP_DAY_COLUMNS)
    .eq("trip_id", tripId)
    .eq("day_date", dayDate)
    .maybeSingle();

  if (selectError) {
    console.error("ensureTripDay: failed to look up trip day", selectError);
    return null;
  }
  if (existing) return mapTripDayRow(existing);

  const { data: inserted, error: insertError } = await supabase
    .from("trip_days")
    .insert({ trip_id: tripId, day_date: dayDate })
    .select(TRIP_DAY_COLUMNS)
    .maybeSingle();

  if (insertError) {
    // A genuine race (two tabs adding the first activity to the same day
    // at once) hits `trip_days_trip_date_unique` - the same "23505 means
    // someone else already won, fetch what they created" handling
    // `createTrip` already establishes.
    if (insertError.code === "23505") {
      const { data: raced } = await supabase
        .from("trip_days")
        .select(TRIP_DAY_COLUMNS)
        .eq("trip_id", tripId)
        .eq("day_date", dayDate)
        .maybeSingle();
      if (raced) return mapTripDayRow(raced);
    }
    console.error("ensureTripDay: failed to create trip day", insertError);
    return null;
  }

  return inserted ? mapTripDayRow(inserted) : null;
}

const tripDaySchema = z.object({
  title: z
    .string()
    .trim()
    .max(150, "Keep it under 150 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  notes: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type TripDayInput = z.input<typeof tripDaySchema>;

export type TripDayMutationResult =
  | { status: "success"; tripDay: TripDay }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates or updates the `trip_days` row for one calendar date - "add a
 * title/notes for Day 3" and "edit Day 3's title/notes" are the same
 * operation, since a day's row either doesn't exist yet or already does
 * (Phase 1 §5: "support the creation and management of itinerary days
 * without duplicating trip data unnecessarily"). `onConflict` targets
 * `trip_days_trip_date_unique` (the migration), so a double-save of the
 * same day updates in place rather than erroring or duplicating.
 *
 * `dayDate` isn't re-validated against the trip's own range here - the
 * itinerary page only ever offers dates `buildItineraryDays` produced
 * (real dates within the trip), and RLS's `trips.owner_id` join is what
 * actually enforces this can only ever write into the caller's own trip.
 */
export async function upsertTripDay(tripId: string, dayDate: string, input: TripDayInput): Promise<TripDayMutationResult> {
  await requireUser();

  const parsed = tripDaySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_days")
    .upsert(
      { trip_id: tripId, day_date: dayDate, title: parsed.data.title, notes: parsed.data.notes },
      { onConflict: "trip_id,day_date" },
    )
    .select(TRIP_DAY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("upsertTripDay: failed to save trip day", error);
    return { status: "error", message: "Couldn't save that day. Please try again." };
  }

  return { status: "success", tripDay: mapTripDayRow(data) };
}

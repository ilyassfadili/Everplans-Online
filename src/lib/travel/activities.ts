import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Activity, ActivityCategory } from "@/types/travel";

import { ensureTripDay } from "./itinerary";

/**
 * The Travel Planner's activity data-access layer (Prompt 2 Phase 2) -
 * `public.trip_activities`. Same shape as `@/lib/travel/itinerary`: every
 * exported function calls `requireUser()` itself, and RLS (a join through
 * `trip_days` back to `trips.owner_id`) independently enforces "only this
 * trip's owner."
 *
 * `server-only`: reads/writes `public.trip_activities` through the server
 * Supabase client. Never safe to import from a Client Component.
 */

const ACTIVITY_COLUMNS = "id, trip_day_id, title, start_time, end_time, location, category, notes, sort_order, created_at, updated_at";

const ACTIVITY_CATEGORIES = [
  "sightseeing",
  "food",
  "transportation",
  "accommodation",
  "entertainment",
  "shopping",
  "nature",
  "other",
] as const satisfies readonly ActivityCategory[];

type ActivityRow = {
  id: string;
  trip_day_id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  category: string;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapActivityRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    tripDayId: row.trip_day_id,
    title: row.title,
    // Postgres returns `time` as `HH:MM:SS` - trimmed to `HH:MM`, the same
    // convention `getImportantDatesForWedding` already applies.
    startTime: row.start_time ? row.start_time.slice(0, 5) : null,
    endTime: row.end_time ? row.end_time.slice(0, 5) : null,
    location: row.location,
    category: row.category as ActivityCategory,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every activity across the given `trip_days` rows - fetched in one query per trip (not per day), then grouped back onto their day by `buildItineraryDays`. */
export async function getActivitiesForTripDayIds(tripDayIds: string[]): Promise<Activity[]> {
  if (tripDayIds.length === 0) return [];

  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_activities")
    .select(ACTIVITY_COLUMNS)
    .in("trip_day_id", tripDayIds)
    // Nulls last (Postgres's default for `asc`) - an activity with no time
    // set reads after every timed activity that day, not scattered
    // arbitrarily among them (Phase 3 §5: "handle activities without a
    // specific time gracefully"). `sort_order` breaks ties within the same
    // time (or the same "no time" group).
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getActivitiesForTripDayIds: failed to load activities", error);
    return [];
  }

  return (data ?? []).map(mapActivityRow);
}

const activitySchema = z
  .object({
    title: z.string().trim().min(1, "Give this activity a title.").max(150, "Keep it under 150 characters."),
    startTime: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
    endTime: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
    location: z
      .string()
      .trim()
      .max(200, "Keep it under 200 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
    category: z.enum(ACTIVITY_CATEGORIES, { message: "Choose a category." }),
    notes: z
      .string()
      .trim()
      .max(1000, "Keep it under 1000 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime >= data.startTime, {
    message: "End time must be on or after the start time.",
    path: ["endTime"],
  });

export type ActivityInput = z.input<typeof activitySchema>;

export type ActivityMutationResult =
  | { status: "success"; activity: Activity }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Adds an activity to a trip's day, creating that day's `trip_days` row
 * first if nothing has been added to it yet (`ensureTripDay`,
 * `@/lib/travel/itinerary`) - a traveler can add an activity to any day in
 * the trip's range without first having to "set up" that day.
 */
export async function createActivity(tripId: string, dayDate: string, input: ActivityInput): Promise<ActivityMutationResult> {
  await requireUser();

  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const tripDay = await ensureTripDay(tripId, dayDate);
  if (!tripDay) {
    return { status: "error", message: "Couldn't add that activity. Please try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_activities")
    .insert({
      trip_day_id: tripDay.id,
      title: parsed.data.title,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      location: parsed.data.location,
      category: parsed.data.category,
      notes: parsed.data.notes,
    })
    .select(ACTIVITY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createActivity: failed to create activity", error);
    return { status: "error", message: "Couldn't add that activity. Please try again." };
  }

  return { status: "success", activity: mapActivityRow(data) };
}

/** Edits an activity in place - full replace (every field, not a partial patch), matching the shape the edit form always submits. */
export async function updateActivity(activityId: string, input: ActivityInput): Promise<ActivityMutationResult> {
  await requireUser();

  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_activities")
    .update({
      title: parsed.data.title,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      location: parsed.data.location,
      category: parsed.data.category,
      notes: parsed.data.notes,
    })
    .eq("id", activityId)
    .select(ACTIVITY_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateActivity: failed to update activity", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", activity: mapActivityRow(data) };
}

export type DeleteActivityResult = { status: "success" } | { status: "error"; message: string };

export async function deleteActivity(activityId: string): Promise<DeleteActivityResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("trip_activities").delete().eq("id", activityId);

  if (error) {
    console.error("deleteActivity: failed to delete activity", error);
    return { status: "error", message: "Couldn't remove that activity. Please try again." };
  }

  return { status: "success" };
}

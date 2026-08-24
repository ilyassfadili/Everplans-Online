"use server";

import { revalidatePath } from "next/cache";

import {
  createActivity,
  deleteActivity,
  updateActivity,
  type ActivityInput,
  type ActivityMutationResult,
  type DeleteActivityResult,
} from "@/lib/travel/activities";
import { upsertTripDay, type TripDayMutationResult } from "@/lib/travel/itinerary";

/**
 * The itinerary's own Server Actions - thin wrappers around
 * `@/lib/travel/itinerary` and `@/lib/travel/activities`, each called
 * directly from a component prop (not `useActionState` - these are plain
 * async functions called with real arguments, the same `handleSave(id,
 * input)` shape `TimelineEntryRow`'s `onSave` prop already uses) rather
 * than a `<form action>` bound to `FormData`, since the calling component
 * already has the real values (`tripId`, `dayDate`, `activityId`) as props,
 * not hidden form fields to parse back out.
 *
 * Every successful mutation revalidates both this page and the dashboard -
 * the same `revalidateTimeline`-style pattern `wedding-planner/timeline/actions.ts`
 * already establishes, so the itinerary always re-renders from fresh
 * server data after a save/delete rather than needing its own client-side
 * cache.
 */

const ITINERARY_PATH = "/app/travel-planner/itinerary";
const DASHBOARD_PATH = "/app/travel-planner";

function revalidateItinerary() {
  revalidatePath(ITINERARY_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function saveTripDayAction(
  tripId: string,
  dayDate: string,
  input: { title?: string; notes?: string },
): Promise<TripDayMutationResult> {
  const result = await upsertTripDay(tripId, dayDate, input);
  if (result.status === "success") {
    revalidateItinerary();
  }
  return result;
}

export async function createActivityAction(tripId: string, dayDate: string, input: ActivityInput): Promise<ActivityMutationResult> {
  const result = await createActivity(tripId, dayDate, input);
  if (result.status === "success") {
    revalidateItinerary();
  }
  return result;
}

export async function updateActivityAction(activityId: string, input: ActivityInput): Promise<ActivityMutationResult> {
  const result = await updateActivity(activityId, input);
  if (result.status === "success") {
    revalidateItinerary();
  }
  return result;
}

export async function deleteActivityAction(activityId: string): Promise<DeleteActivityResult> {
  const result = await deleteActivity(activityId);
  if (result.status === "success") {
    revalidateItinerary();
  }
  return result;
}

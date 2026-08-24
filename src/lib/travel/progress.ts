import type { PackingItem, PackingProgress, Trip, TripSetupProgress } from "@/types/travel";

/**
 * Trip setup progress, derived from a trip's own fields at read time - the
 * same "derived, never stored" rule `@/lib/wedding/progress.ts` follows for
 * `WeddingProgress`. Destination, dates, traveler count, and trip type are
 * all required at creation (`createTrip`'s own schema), so they're always
 * complete the moment a trip exists; goals and notes are optional
 * enrichments a couple/traveler can add later, so they're the two steps
 * that actually vary here. Deliberately scoped to only what Prompt 1
 * implemented - no itinerary/budget/booking/packing/document steps, which
 * don't exist yet (Prompt 1 Phase 4: "do not create fake progress for
 * features that do not yet exist").
 */
export function calculateTripSetupProgress(trip: Trip): TripSetupProgress {
  const steps = [
    trip.destination.length > 0,
    Boolean(trip.startDate && trip.endDate),
    trip.travelerCount > 0,
    Boolean(trip.tripType),
    Boolean(trip.tripGoals),
    Boolean(trip.notes),
  ];

  const completedSteps = steps.filter(Boolean).length;
  const totalSteps = steps.length;

  return {
    completedSteps,
    totalSteps,
    percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
  };
}

/** Packing checklist progress (Prompt 4 Phase 1) - derived, never stored, the same rule every other progress type here follows. `totalCount === 0` (no items yet) reads as 0%, not a fabricated 100%. */
export function calculatePackingProgress(items: PackingItem[]): PackingProgress {
  const completedCount = items.filter((item) => item.isComplete).length;
  const totalCount = items.length;

  return {
    completedCount,
    totalCount,
    percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

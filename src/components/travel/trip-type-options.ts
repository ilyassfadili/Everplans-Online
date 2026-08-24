import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Trip Type `Select`'s curated option list - matches `trips_trip_type_valid`
 * (the migration) and `TripType` (`@/types/travel`) exactly, the same
 * "curated free-text option list" pattern `@/components/wedding/event-type-options.ts`
 * already establishes.
 */
export const TRIP_TYPE_OPTIONS: SelectOption[] = [
  { value: "vacation", label: "Vacation" },
  { value: "family", label: "Family trip" },
  { value: "couple", label: "Couple trip" },
  { value: "solo", label: "Solo trip" },
  { value: "business", label: "Business trip" },
  { value: "road-trip", label: "Road trip" },
  { value: "other", label: "Other" },
];

const TRIP_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TRIP_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `trip_type` value back into its display label. Falls back to the raw value for a type that's somehow outside the curated list, so a display never renders `undefined`. */
export function getTripTypeLabel(tripType: string): string {
  return TRIP_TYPE_LABELS[tripType] ?? tripType;
}

import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Activity Category `Select`'s curated option list - matches
 * `trip_activities_category_valid` (the migration) and `ActivityCategory`
 * (`@/types/travel`) exactly, the same pattern `@/components/travel/trip-type-options.ts`
 * already establishes for trip type.
 */
export const ACTIVITY_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "sightseeing", label: "Sightseeing" },
  { value: "food", label: "Food" },
  { value: "transportation", label: "Transportation" },
  { value: "accommodation", label: "Accommodation" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "nature", label: "Nature" },
  { value: "other", label: "Other" },
];

const ACTIVITY_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  ACTIVITY_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `category` value back into its display label. Falls back to the raw value so a display never renders `undefined`. */
export function getActivityCategoryLabel(category: string): string {
  return ACTIVITY_CATEGORY_LABELS[category] ?? category;
}

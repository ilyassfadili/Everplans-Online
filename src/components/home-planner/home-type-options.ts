import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Home Type `Select`'s curated option list - matches `homes_home_type_valid`
 * (the migration) and `HomeType` (`@/types/home-planner`) exactly, the same
 * "curated free-text option list" pattern `@/components/travel/trip-type-options.ts`
 * already establishes. Deliberately not restrictive - Phase 2's own
 * instruction ("do not make the predefined list unnecessarily restrictive")
 * - so "Other" is always a safe fallback.
 */
export const HOME_TYPE_OPTIONS: SelectOption[] = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "mobile-home", label: "Mobile home" },
  { value: "other", label: "Other" },
];

const HOME_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  HOME_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `home_type` value back into its display label. Falls back to the raw value for a type that's somehow outside the curated list, so a display never renders `undefined`. */
export function getHomeTypeLabel(homeType: string): string {
  return HOME_TYPE_LABELS[homeType] ?? homeType;
}

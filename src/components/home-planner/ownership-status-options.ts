import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Ownership Status `Select`'s curated option list - matches
 * `homes_ownership_status_valid` (the migration) and `OwnershipStatus`
 * (`@/types/home-planner`) exactly.
 */
export const OWNERSHIP_STATUS_OPTIONS: SelectOption[] = [
  { value: "own", label: "Own" },
  { value: "rent", label: "Rent" },
  { value: "other", label: "Other" },
];

const OWNERSHIP_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  OWNERSHIP_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `ownership_status` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getOwnershipStatusLabel(ownershipStatus: string): string {
  return OWNERSHIP_STATUS_LABELS[ownershipStatus] ?? ownershipStatus;
}

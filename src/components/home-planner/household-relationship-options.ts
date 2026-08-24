import type { SelectOption } from "@/components/ui/form/select";

/**
 * The household member Relationship `Select`'s curated option list -
 * matches `household_members_relationship_valid` (the migration) and
 * `HouseholdRelationship` (`@/types/home-planner`) exactly.
 */
export const HOUSEHOLD_RELATIONSHIP_OPTIONS: SelectOption[] = [
  { value: "self", label: "Self" },
  { value: "spouse-partner", label: "Spouse / Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "roommate", label: "Roommate" },
  { value: "pet", label: "Pet" },
  { value: "other", label: "Other" },
];

const HOUSEHOLD_RELATIONSHIP_LABELS: Record<string, string> = Object.fromEntries(
  HOUSEHOLD_RELATIONSHIP_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `relationship` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getHouseholdRelationshipLabel(relationship: string): string {
  return HOUSEHOLD_RELATIONSHIP_LABELS[relationship] ?? relationship;
}

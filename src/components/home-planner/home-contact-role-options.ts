import type { SelectOption } from "@/components/ui/form/select";

/**
 * The important contact Role `Select`'s curated option list - matches
 * `home_contacts_role_valid` (the migration) and `HomeContactRole`
 * (`@/types/home-planner`) exactly.
 */
export const HOME_CONTACT_ROLE_OPTIONS: SelectOption[] = [
  { value: "property-manager", label: "Property manager" },
  { value: "landlord", label: "Landlord" },
  { value: "contractor", label: "Contractor" },
  { value: "emergency-contact", label: "Emergency contact" },
  { value: "service-provider", label: "Service provider" },
  { value: "other", label: "Other" },
];

const HOME_CONTACT_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  HOME_CONTACT_ROLE_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `role` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getHomeContactRoleLabel(role: string): string {
  return HOME_CONTACT_ROLE_LABELS[role] ?? role;
}

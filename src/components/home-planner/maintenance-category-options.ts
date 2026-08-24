import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Maintenance Category `Select`'s curated option list - matches
 * `home_maintenance_tasks_category_valid` (the migration) and
 * `MaintenanceCategory` (`@/types/home-planner`) exactly.
 */
export const MAINTENANCE_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "appliances", label: "Appliances" },
  { value: "cleaning", label: "Cleaning" },
  { value: "safety", label: "Safety" },
  { value: "exterior", label: "Exterior" },
  { value: "garden", label: "Garden" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const MAINTENANCE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  MAINTENANCE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `category` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getMaintenanceCategoryLabel(category: string): string {
  return MAINTENANCE_CATEGORY_LABELS[category] ?? category;
}

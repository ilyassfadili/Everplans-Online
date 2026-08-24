import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Maintenance Priority `Select`'s curated option list - matches
 * `home_maintenance_tasks_priority_valid` (the migration) and
 * `MaintenancePriority` (`@/types/home-planner`) exactly.
 */
export const MAINTENANCE_PRIORITY_OPTIONS: SelectOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const MAINTENANCE_PRIORITY_LABELS: Record<string, string> = Object.fromEntries(
  MAINTENANCE_PRIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `priority` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getMaintenancePriorityLabel(priority: string): string {
  return MAINTENANCE_PRIORITY_LABELS[priority] ?? priority;
}

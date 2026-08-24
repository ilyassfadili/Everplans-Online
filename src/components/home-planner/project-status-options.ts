import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Project Status `Select`'s curated option list - matches
 * `home_projects_status_valid` (the migration) and `ProjectStatus`
 * (`@/types/home-planner`) exactly.
 */
export const PROJECT_STATUS_OPTIONS: SelectOption[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

const PROJECT_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  PROJECT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `status` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getProjectStatusLabel(status: string): string {
  return PROJECT_STATUS_LABELS[status] ?? status;
}

const PROJECT_STATUS_VARIANT: Record<string, "neutral" | "warning" | "success" | "brand"> = {
  planning: "neutral",
  in_progress: "brand",
  on_hold: "warning",
  completed: "success",
};

/** Resolves a stored `status` value into the `Badge` variant that communicates it - planning/paused read as neutral/warning, active work as brand, done as success. */
export function getProjectStatusVariant(status: string): "neutral" | "warning" | "success" | "brand" {
  return PROJECT_STATUS_VARIANT[status] ?? "neutral";
}

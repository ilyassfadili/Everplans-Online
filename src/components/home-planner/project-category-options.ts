import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Project Category `Select`'s curated option list - matches
 * `home_projects_category_valid` (the migration) and `ProjectCategory`
 * (`@/types/home-planner`) exactly.
 */
export const PROJECT_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "renovation", label: "Renovation" },
  { value: "repair", label: "Repair" },
  { value: "decoration", label: "Decoration" },
  { value: "furniture", label: "Furniture" },
  { value: "garden", label: "Garden" },
  { value: "improvement", label: "Improvement" },
  { value: "other", label: "Other" },
];

const PROJECT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  PROJECT_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `category` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getProjectCategoryLabel(category: string): string {
  return PROJECT_CATEGORY_LABELS[category] ?? category;
}

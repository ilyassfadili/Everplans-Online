import type { SelectOption } from "@/components/ui/form/select";

/** The Packing Category `Select`'s curated option list - matches `trip_packing_items_category_valid` (the migration) and `PackingCategory` (`@/types/travel`) exactly. Deliberately short (Phase 1 §3: "do not create excessive categories"). */
export const PACKING_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "clothing", label: "Clothing" },
  { value: "toiletries", label: "Toiletries" },
  { value: "electronics", label: "Electronics" },
  { value: "travel-documents", label: "Travel documents" },
  { value: "personal-essentials", label: "Personal essentials" },
  { value: "health", label: "Health & personal care" },
  { value: "other", label: "Other" },
];

const PACKING_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  PACKING_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

export function getPackingCategoryLabel(category: string): string {
  return PACKING_CATEGORY_LABELS[category] ?? category;
}

/** Display order for grouping the checklist by category - matches the option list order above. */
export const PACKING_CATEGORY_ORDER = PACKING_CATEGORY_OPTIONS.map((option) => option.value);

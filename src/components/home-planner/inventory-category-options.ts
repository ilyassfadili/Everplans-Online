import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Inventory Category `Select`'s curated option list - matches
 * `home_inventory_items_category_valid` (the migration) and
 * `InventoryCategory` (`@/types/home-planner`) exactly.
 */
export const INVENTORY_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "furniture", label: "Furniture" },
  { value: "electronics", label: "Electronics" },
  { value: "appliances", label: "Appliances" },
  { value: "kitchen", label: "Kitchen" },
  { value: "tools", label: "Tools" },
  { value: "clothing", label: "Clothing" },
  { value: "outdoor", label: "Outdoor" },
  { value: "other", label: "Other" },
];

const INVENTORY_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  INVENTORY_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `category` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getInventoryCategoryLabel(category: string): string {
  return INVENTORY_CATEGORY_LABELS[category] ?? category;
}

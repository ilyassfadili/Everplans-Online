import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Bill Category `Select`'s curated option list - matches
 * `home_bills_category_valid` (the migration) and `BillCategory`
 * (`@/types/home-planner`) exactly.
 */
export const BILL_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "gas", label: "Gas" },
  { value: "internet", label: "Internet" },
  { value: "phone", label: "Phone" },
  { value: "insurance", label: "Insurance" },
  { value: "rent", label: "Rent" },
  { value: "mortgage", label: "Mortgage" },
  { value: "subscription", label: "Subscription" },
  { value: "property-services", label: "Property services" },
  { value: "other", label: "Other" },
];

const BILL_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BILL_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `category` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getBillCategoryLabel(category: string): string {
  return BILL_CATEGORY_LABELS[category] ?? category;
}

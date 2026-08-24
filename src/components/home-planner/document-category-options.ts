import type { SelectOption } from "@/components/ui/form/select";

/**
 * The Document Category `Select`'s curated option list - matches
 * `home_documents_category_valid` (the migration) and
 * `HomeDocumentCategory` (`@/types/home-planner`) exactly.
 */
export const DOCUMENT_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "property", label: "Property documents" },
  { value: "rental", label: "Rental documents" },
  { value: "insurance", label: "Insurance" },
  { value: "warranty", label: "Warranties" },
  { value: "receipt", label: "Receipts" },
  { value: "manual", label: "Manuals" },
  { value: "record", label: "Home records" },
  { value: "other", label: "Other" },
];

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `category` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getDocumentCategoryLabel(category: string): string {
  return DOCUMENT_CATEGORY_LABELS[category] ?? category;
}

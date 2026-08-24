import type { SelectOption } from "@/components/ui/form/select";

/** The Document Type `Select`'s curated option list - matches `trip_documents_type_valid` (the migration) and `TravelDocumentType` (`@/types/travel`) exactly. */
export const DOCUMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: "passport", label: "Passport" },
  { value: "visa", label: "Visa" },
  { value: "insurance", label: "Travel insurance" },
  { value: "id", label: "ID" },
  { value: "tickets", label: "Tickets" },
  { value: "booking-confirmation", label: "Booking confirmation" },
  { value: "other", label: "Other" },
];

const DOCUMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(DOCUMENT_TYPE_OPTIONS.map((option) => [option.value, option.label]));

export function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type;
}

/** The Document Status `Select`'s curated option list - matches `trip_documents_status_valid` (the migration) and `TravelDocumentStatus` (`@/types/travel`) exactly. */
export const DOCUMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: "needed", label: "Needed" },
  { value: "ready", label: "Ready" },
  { value: "expired", label: "Expired" },
  { value: "not-required", label: "Not required" },
];

const DOCUMENT_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

export function getDocumentStatusLabel(status: string): string {
  return DOCUMENT_STATUS_LABELS[status] ?? status;
}

/** Badge tone per status - calm, not alarming for "not required" (a normal outcome, not a gap), reserving warning for what actually needs attention. */
export const DOCUMENT_STATUS_BADGE_VARIANT: Record<string, "neutral" | "success" | "warning"> = {
  needed: "neutral",
  ready: "success",
  expired: "warning",
  "not-required": "neutral",
};

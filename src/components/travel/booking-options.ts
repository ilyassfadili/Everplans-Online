import type { SelectOption } from "@/components/ui/form/select";

/** The Booking Type `Select`'s curated option list - matches `trip_bookings_type_valid` (the migration) and `BookingType` (`@/types/travel`) exactly. */
export const BOOKING_TYPE_OPTIONS: SelectOption[] = [
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "hotel", label: "Hotel / Accommodation" },
  { value: "car-rental", label: "Car rental" },
  { value: "activity", label: "Activity" },
  { value: "restaurant", label: "Restaurant" },
  { value: "other", label: "Other" },
];

const BOOKING_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BOOKING_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

export function getBookingTypeLabel(bookingType: string): string {
  return BOOKING_TYPE_LABELS[bookingType] ?? bookingType;
}

/** The Booking Status `Select`'s curated option list - matches `trip_bookings_status_valid` (the migration) and `BookingStatus` (`@/types/travel`) exactly. */
export const BOOKING_STATUS_OPTIONS: SelectOption[] = [
  { value: "planned", label: "Planned" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const BOOKING_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  BOOKING_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

export function getBookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status] ?? status;
}

/** Badge tone per status - calm, not alarming (the same restraint `PriorityBadge`/`getTimelineStatus` already apply): "cancelled" reads as neutral/muted, not error-red - it's a normal outcome, not a failure. */
export const BOOKING_STATUS_BADGE_VARIANT: Record<string, "neutral" | "brand" | "success"> = {
  planned: "neutral",
  confirmed: "success",
  cancelled: "neutral",
};

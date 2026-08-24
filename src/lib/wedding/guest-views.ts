import type { GuestRsvpSummary, WeddingGuest } from "@/types/wedding";

/**
 * Pure derivation over an already-fetched guest list - no database access
 * (deliberately not `server-only`, unlike `@/lib/wedding/guests`: this is
 * imported directly from the client-side guest list for its live RSVP
 * counts, the same split `@/lib/wedding/task-views` already established
 * for tasks).
 */
export function calculateGuestRsvpSummary(guests: WeddingGuest[]): GuestRsvpSummary {
  return {
    totalGuests: guests.length,
    attending: guests.filter((guest) => guest.rsvpStatus === "attending").length,
    notAttending: guests.filter((guest) => guest.rsvpStatus === "not-attending").length,
    notResponded: guests.filter((guest) => guest.rsvpStatus === "not-responded").length,
  };
}

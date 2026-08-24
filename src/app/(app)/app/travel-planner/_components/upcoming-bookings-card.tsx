import { Ticket } from "lucide-react";

import { Badge, Button, Card, EmptyState, Text } from "@/components/ui";
import { BOOKING_STATUS_BADGE_VARIANT, getBookingStatusLabel, getBookingTypeLabel } from "@/components/travel/booking-options";
import { formatBookingDate } from "@/lib/travel/format";
import type { Booking } from "@/types/travel";

import { PanelHeader } from "./panel-header";

interface UpcomingBookingsCardProps {
  bookings: Booking[];
}

/**
 * The dashboard's booking summary (Prompt 3 Phase 4 §3) - the next
 * upcoming booking and how many exist in total, read from the same
 * `getBookingsForTrip` list the Bookings page itself renders (already
 * sorted soonest-first by the query). Only real data - a trip with zero
 * bookings shows the same honest empty state every other dashboard panel
 * in this codebase uses, never a fabricated "0 bookings" stat treated as
 * an achievement.
 */
export function UpcomingBookingsCard({ bookings }: UpcomingBookingsCardProps) {
  if (bookings.length === 0) {
    return (
      <Card variant="standard" padding="lg" className="flex h-full flex-col">
        <PanelHeader icon={Ticket} title="Bookings" />
        <EmptyState
          className="mt-4 border-none bg-transparent px-0 py-6"
          title="No bookings yet"
          description="Add a flight, hotel, or any other reservation to keep it organized in one place."
          action={
            <Button href="/app/travel-planner/bookings" variant="secondary" size="sm">
              Add a booking
            </Button>
          }
        />
      </Card>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextBooking = bookings.find((booking) => booking.status !== "cancelled" && booking.bookingDate >= today) ?? bookings[0]!;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={Ticket} title="Bookings" />
      <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{getBookingTypeLabel(nextBooking.bookingType)}</Badge>
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[nextBooking.status] ?? "neutral"}>{getBookingStatusLabel(nextBooking.status)}</Badge>
          </div>
          <Text size="body" weight="medium" className="mt-2 text-ink">
            {nextBooking.title}
          </Text>
          <Text size="body-sm" tone="muted" className="mt-0.5">
            {formatBookingDate(nextBooking.bookingDate)}
          </Text>
          <Text size="body-sm" tone="faint" className="mt-2">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} total
          </Text>
        </div>
        <Button href="/app/travel-planner/bookings" variant="ghost" size="sm" className="self-start">
          View bookings
        </Button>
      </div>
    </Card>
  );
}

import type { LucideIcon } from "lucide-react";

import { Badge, Button, Card, Heading, Icon, Text } from "@/components/ui";
import { getBookingTypeLabel } from "@/components/travel/booking-options";
import { formatBookingDate } from "@/lib/travel/format";
import type { Booking } from "@/types/travel";

interface BookingInfoCardProps {
  icon: LucideIcon;
  title: string;
  bookings: Booking[];
  emptyDescription: string;
}

/**
 * Accommodation/transportation information (Phase 3 §3) - read directly
 * from Prompt 3's `trip_bookings`, filtered by type, not a second copy of
 * the same data (Phase 3 §3: "reuse booking information... do not create
 * duplicate booking records"). Read-only here on purpose: editing a
 * booking still happens on the Bookings page itself, so there's exactly
 * one place that ever writes this data.
 */
export function BookingInfoCard({ icon, title, bookings, emptyDescription }: BookingInfoCardProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center gap-2.5">
        <Icon icon={icon} size="sm" className="text-ink-faint" />
        <Heading as="h2" size="h4">
          {title}
        </Heading>
      </div>

      {bookings.length === 0 ? (
        <>
          <Text size="body-sm" tone="muted" className="mt-2">
            {emptyDescription}
          </Text>
          <Button href="/app/travel-planner/bookings" variant="ghost" size="sm" className="mt-3">
            Add a booking
          </Button>
        </>
      ) : (
        <div className="mt-3 flex flex-col divide-y divide-line-subtle">
          {bookings.map((booking) => (
            <div key={booking.id} className="py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Text size="body-sm" weight="medium" className="text-ink">
                  {booking.title}
                </Text>
                <Badge variant="outline">{getBookingTypeLabel(booking.bookingType)}</Badge>
              </div>
              <Text size="body-sm" tone="muted" className="mt-0.5">
                {formatBookingDate(booking.bookingDate)}
                {booking.location ? ` · ${booking.location}` : ""}
              </Text>
            </div>
          ))}
          <Button href="/app/travel-planner/bookings" variant="ghost" size="sm" className="mt-1 self-start pt-2.5">
            View all bookings
          </Button>
        </div>
      )}
    </Card>
  );
}

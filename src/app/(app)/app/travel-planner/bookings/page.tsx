import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getBookingsForTrip } from "@/lib/travel/bookings";
import { requireTripForCurrentUser } from "@/lib/travel/trips";

import { PageHeader } from "../../_components/page-header";
import { AddBookingForm } from "./_components/add-booking-form";
import { BookingsList } from "./_components/bookings-list";

export const metadata: Metadata = {
  title: "Bookings",
  robots: { index: false, follow: false },
};

/**
 * The Travel Planner's Bookings page (Everplans Travel Planner Prompt 3
 * Phase 3) - a centralized ORGANIZATION record for reservations the
 * traveler already made elsewhere (flights, hotels, activities, ...), not
 * a booking marketplace. Gated the same way every Travel Planner route is:
 * no trip yet redirects to trip setup.
 */
export default async function BookingsPage() {
  const trip = await requireTripForCurrentUser();

  const bookings = await getBookingsForTrip(trip.id);

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <PageHeader title="Bookings" description="Keep every reservation - flights, hotels, and more - organized in one place." />
      <AddBookingForm tripId={trip.id} />
      <BookingsList bookings={bookings} currency={trip.currency} />
    </Container>
  );
}

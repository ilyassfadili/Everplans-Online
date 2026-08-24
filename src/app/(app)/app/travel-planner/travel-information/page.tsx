import type { Metadata } from "next";
import { Building2, Plane } from "lucide-react";

import { Container } from "@/components/ui";
import { getBookingsForTrip } from "@/lib/travel/bookings";
import { getEmergencyContactsForTrip } from "@/lib/travel/emergency-contacts";
import { requireTripForCurrentUser } from "@/lib/travel/trips";
import type { BookingType } from "@/types/travel";

import { PageHeader } from "../../_components/page-header";
import { BookingInfoCard } from "./_components/booking-info-card";
import { EmergencyContactsCard } from "./_components/emergency-contacts-card";
import { ImportantNotesCard } from "./_components/important-notes-card";
import { TripBasicsCard } from "./_components/trip-basics-card";

export const metadata: Metadata = {
  title: "Travel Information",
  robots: { index: false, follow: false },
};

const TRANSPORTATION_TYPES: BookingType[] = ["flight", "train", "bus", "car-rental"];

/**
 * The Travel Planner's centralized "everything you'd need while
 * traveling" page (Everplans Travel Planner Prompt 4 Phase 3). Trip
 * basics, accommodation, and transportation are all read from data that
 * already exists (`trips`, `trip_bookings`) - only emergency contacts are
 * genuinely new here, per Phase 3's own "reuse, don't duplicate" rule.
 * Gated the same way every Travel Planner route is: no trip yet redirects
 * to trip setup.
 */
export default async function TravelInformationPage() {
  const trip = await requireTripForCurrentUser();

  const [bookings, contacts] = await Promise.all([getBookingsForTrip(trip.id), getEmergencyContactsForTrip(trip.id)]);

  const accommodationBookings = bookings.filter((booking) => booking.bookingType === "hotel");
  const transportationBookings = bookings.filter((booking) => TRANSPORTATION_TYPES.includes(booking.bookingType));

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <PageHeader title="Travel Information" description="Everything worth having close at hand while you're traveling." />

      <div className="grid gap-6 lg:grid-cols-2">
        <TripBasicsCard trip={trip} />
        <ImportantNotesCard notes={trip.notes} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingInfoCard
          icon={Building2}
          title="Accommodation"
          bookings={accommodationBookings}
          emptyDescription="No accommodation booked yet."
        />
        <BookingInfoCard
          icon={Plane}
          title="Transportation"
          bookings={transportationBookings}
          emptyDescription="No transportation booked yet."
        />
      </div>

      <EmergencyContactsCard tripId={trip.id} contacts={contacts} />
    </Container>
  );
}

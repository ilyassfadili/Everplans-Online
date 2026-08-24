import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { redirect } from "next/navigation";

import { Container, EmptyState } from "@/components/ui";
import { getEventsForWedding } from "@/lib/wedding/events";
import { getVenuesForWedding } from "@/lib/wedding/venues";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { PageHeader } from "../../_components/page-header";
import { AddEventForm } from "./_components/add-event-form";
import { EventCard } from "./_components/event-card";
import { VenueList } from "./_components/venue-list";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

/**
 * The Wedding Planner's events and venues (Prompt 5 Phase 1-2) - one
 * unified `wedding_events` table represents ceremony, reception,
 * rehearsal, or any other kind of event as data, not separate systems.
 * Gated the same way every Wedding Planner route is: no workspace yet
 * redirects to onboarding.
 */
export default async function EventsPage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const [events, venues] = await Promise.all([getEventsForWedding(wedding.id), getVenuesForWedding(wedding.id)]);
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Events" description="Every event around your wedding day, and where each one happens." />

      <VenueList weddingId={wedding.id} venues={venues} />

      <div className="flex flex-col gap-6">
        <AddEventForm weddingId={wedding.id} venues={venues} />

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Shape your celebration"
            description="Add your ceremony, reception, or any other event above."
            className="py-14"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} venue={event.venueId ? (venueById.get(event.venueId) ?? null) : null} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

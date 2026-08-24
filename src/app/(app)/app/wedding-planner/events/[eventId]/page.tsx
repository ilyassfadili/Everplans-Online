import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { getEventById, getGuestIdsForEvent, getVendorIdsForEvent } from "@/lib/wedding/events";
import { getGuestsForWedding } from "@/lib/wedding/guests";
import { getTasksForWedding } from "@/lib/wedding/tasks";
import { getVendorsForWedding } from "@/lib/wedding/vendors";
import { getVenuesForWedding } from "@/lib/wedding/venues";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { EventDetailView } from "./_components/event-detail-view";

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export const metadata: Metadata = {
  title: "Event",
  robots: { index: false, follow: false },
};

/**
 * One event's detail view (Prompt 5 Phase 2) - editable identity/timing,
 * its venue, the canonical vendors and guests linked to it
 * (`wedding_event_vendors`/`wedding_event_guests`, never a copy of vendor/
 * guest data), and the tasks that belong to it (extends the existing task
 * architecture via `wedding_tasks.event_id`).
 */
export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const event = await getEventById(eventId);
  if (!event || event.weddingId !== wedding.id) {
    notFound();
  }

  const [venues, vendors, guests, tasks, assignedVendorIds, assignedGuestIds] = await Promise.all([
    getVenuesForWedding(wedding.id),
    getVendorsForWedding(wedding.id),
    getGuestsForWedding(wedding.id),
    getTasksForWedding(wedding.id),
    getVendorIdsForEvent(event.id),
    getGuestIdsForEvent(event.id),
  ]);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/wedding-planner/events" variant="subtle" className="text-body-sm">
        ← All events
      </Link>
      <EventDetailView
        weddingId={wedding.id}
        event={event}
        venues={venues}
        vendors={vendors}
        guests={guests}
        tasks={tasks}
        assignedVendorIds={assignedVendorIds}
        assignedGuestIds={assignedGuestIds}
      />
    </Container>
  );
}

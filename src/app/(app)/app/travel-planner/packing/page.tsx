import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getPackingItemsForTrip } from "@/lib/travel/packing";
import { calculatePackingProgress } from "@/lib/travel/progress";
import { requireTripForCurrentUser } from "@/lib/travel/trips";

import { PageHeader } from "../../_components/page-header";
import { PackingList } from "./_components/packing-list";

export const metadata: Metadata = {
  title: "Packing",
  robots: { index: false, follow: false },
};

/**
 * The Travel Planner's Packing checklist (Everplans Travel Planner Prompt
 * 4 Phase 1). Gated the same way every Travel Planner route is: no trip
 * yet redirects to trip setup.
 */
export default async function PackingPage() {
  const trip = await requireTripForCurrentUser();

  const items = await getPackingItemsForTrip(trip.id);
  const progress = calculatePackingProgress(items);

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <PageHeader title="Packing" description="See what remains, check items off, and add anything custom." />
      <PackingList tripId={trip.id} items={items} progress={progress} />
    </Container>
  );
}

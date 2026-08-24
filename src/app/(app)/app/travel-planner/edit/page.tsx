import type { Metadata } from "next";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { requireTripForCurrentUser } from "@/lib/travel/trips";

import { EditTripForm } from "./_components/edit-trip-form";

export const metadata: Metadata = {
  title: "Edit Trip Details",
  robots: { index: false, follow: false },
};

/**
 * Edit trip details (Prompt 1 Phase 3/4: "provide appropriate entry points
 * ... edit trip details, update trip setup"). Unlike Wedding Planner's
 * narrow single-field `updateWeddingDate`, Travel Planner ships full trip
 * setup as editable from day one - the same `TripFormFields` used to
 * create the trip, pre-filled with its current values. `requireTripForCurrentUser()`
 * (Prompt 6 Phase 1/2) gates the route: a visitor without an active
 * entitlement is sent to checkout, one entitled but not yet set up is sent
 * to trip setup, so this screen only ever renders for a trip that genuinely
 * exists.
 */
export default async function EditTripPage() {
  const trip = await requireTripForCurrentUser();

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Travel Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Edit trip details
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Update anything about your trip - your changes save right here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <EditTripForm trip={trip} />
      </Card>
    </Container>
  );
}

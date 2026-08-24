import { CalendarRange, Pencil } from "lucide-react";

import { Badge, Button, Eyebrow, Heading, Text } from "@/components/ui";
import { getTripTypeLabel } from "@/components/travel/trip-type-options";
import { formatDateRange } from "@/lib/travel/format";
import type { Trip } from "@/types/travel";

interface TravelHeaderProps {
  trip: Trip;
}

/**
 * The dashboard's own personalized identity block - the Travel Planner's
 * equivalent of `WeddingHeader`. Real session data only (this user's own
 * trip, resolved server-side), never a generic placeholder greeting.
 * "Edit trip" (Prompt 1 Phase 4 §5) and "View itinerary" (Prompt 2 Phase 4
 * §1: "refine itinerary navigation ... make frequent actions easy to
 * access") are the two entry points this header carries - both real,
 * already-implemented destinations, not placeholders for later prompts.
 */
export function TravelHeader({ trip }: TravelHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 animate-hero-in" style={{ animationDelay: "40ms" }}>
      <div>
        <Eyebrow tone="brand">Your Trip</Eyebrow>
        <Heading as="h1" size="h2" className="mt-1">
          {trip.destination}
        </Heading>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Text size="body-lg" tone="muted">
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
          <Badge variant="brand">{getTripTypeLabel(trip.tripType)}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          href="/app/travel-planner/itinerary"
          variant="secondary"
          size="sm"
          leadingIcon={<CalendarRange className="size-4" strokeWidth={1.75} aria-hidden="true" />}
        >
          View itinerary
        </Button>
        <Button
          href="/app/travel-planner/edit"
          variant="ghost"
          size="sm"
          leadingIcon={<Pencil className="size-4" strokeWidth={1.75} aria-hidden="true" />}
        >
          Edit trip
        </Button>
      </div>
    </div>
  );
}

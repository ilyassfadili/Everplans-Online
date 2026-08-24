import { MapPin } from "lucide-react";

import { Card, Heading, Icon, Text } from "@/components/ui";
import { formatDateRange } from "@/lib/travel/format";
import type { Trip } from "@/types/travel";

interface TripBasicsCardProps {
  trip: Trip;
}

/** Destination, dates, and traveler count - read directly from the trip itself (Prompt 1), never re-entered here (Phase 3 §4: "reuse existing trip information instead of duplicating"). */
export function TripBasicsCard({ trip }: TripBasicsCardProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center gap-2.5">
        <Icon icon={MapPin} size="sm" className="text-ink-faint" />
        <Heading as="h2" size="h4">
          Trip Basics
        </Heading>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <Text size="body-sm" weight="medium" className="text-ink">
          {trip.destination}
        </Text>
        <Text size="body-sm" tone="muted">
          {formatDateRange(trip.startDate, trip.endDate)}
        </Text>
        <Text size="body-sm" tone="muted">
          {trip.travelerCount} {trip.travelerCount === 1 ? "traveler" : "travelers"}
        </Text>
      </div>
    </Card>
  );
}

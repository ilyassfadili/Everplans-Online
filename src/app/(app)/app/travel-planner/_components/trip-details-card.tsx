import { Compass, MapPin, Moon, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, Icon, Text } from "@/components/ui";
import { getTripTypeLabel } from "@/components/travel/trip-type-options";
import { calculateTripNights, formatDateRange } from "@/lib/travel/format";
import type { Trip } from "@/types/travel";

import { PanelHeader } from "./panel-header";

interface TripDetailsCardProps {
  trip: Trip;
}

function DetailRow({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
        <Icon icon={icon} size="sm" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Text size="body-sm" tone="faint">
          {label}
        </Text>
        <Text size="body-sm" weight="medium" className="truncate text-ink">
          {value}
        </Text>
      </div>
    </div>
  );
}

/**
 * The dashboard's at-a-glance trip facts - destination, dates/duration,
 * travelers, and trip type - everything Prompt 1 Phase 4 §3 asks the
 * dashboard to show, in one scannable card rather than scattered across
 * several. `TravelHeader` already shows destination/dates/type prominently
 * above the fold; this card exists for the reader who wants the full set
 * (including duration and traveler count) in one place.
 */
export function TripDetailsCard({ trip }: TripDetailsCardProps) {
  const nights = calculateTripNights(trip.startDate, trip.endDate);

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={Compass} title="Trip Details" />
      <div className="mt-2 flex flex-1 flex-col divide-y divide-line-subtle">
        <DetailRow icon={MapPin} label="Destination" value={trip.destination} />
        <DetailRow
          icon={Moon}
          label="Dates"
          value={`${formatDateRange(trip.startDate, trip.endDate)} · ${nights} ${nights === 1 ? "night" : "nights"}`}
        />
        <DetailRow
          icon={Users}
          label="Travelers"
          value={`${trip.travelerCount} ${trip.travelerCount === 1 ? "traveler" : "travelers"}`}
        />
        <DetailRow icon={Compass} label="Trip type" value={getTripTypeLabel(trip.tripType)} />
      </div>
    </Card>
  );
}

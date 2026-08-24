import { CalendarClock } from "lucide-react";

import { Card, Text } from "@/components/ui";
import { TravelFlourish } from "@/components/travel/travel-flourish";
import { getTripTiming } from "@/lib/travel/format";

interface TripCountdownCardProps {
  startDate: string;
  endDate: string;
}

/**
 * A calm, static "time until the trip" card - the Travel Planner's
 * equivalent of `WeddingCountdown`, minus the live tick: a trip is dated in
 * whole days (`getTripTiming`'s own comment), so a number that updates once
 * per page load is the honest granularity, not a ticking clock implying
 * more precision than the data actually has.
 */
export function TripCountdownCard({ startDate, endDate }: TripCountdownCardProps) {
  const timing = getTripTiming(startDate, endDate);

  return (
    <Card
      variant="standard"
      padding="lg"
      className="relative flex h-full flex-col items-center justify-center gap-1 overflow-hidden text-center"
    >
      <TravelFlourish className="pointer-events-none absolute -right-3 -top-3 h-20 w-28 text-brand/[0.06]" />
      <CalendarClock className="size-5 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />

      {timing.state === "upcoming" && (
        <>
          <Text size="body-sm" tone="muted" weight="medium" className="mt-2">
            Your trip is in
          </Text>
          <p className="mt-1 font-display text-h1 tabular-nums text-ink">{timing.daysUntil}</p>
          <Text size="body-sm" tone="faint">
            {timing.daysUntil === 1 ? "day to go" : "days to go"}
          </Text>
        </>
      )}

      {timing.state === "ongoing" && (
        <>
          <p className="mt-2 font-display text-h2 text-ink">You&rsquo;re on your trip</p>
          <Text size="body-sm" tone="faint" className="mt-1">
            Have a wonderful time.
          </Text>
        </>
      )}

      {timing.state === "completed" && (
        <>
          <p className="mt-2 font-display text-h2 text-ink">Trip completed</p>
          <Text size="body-sm" tone="faint" className="mt-1">
            Hope it was everything you planned for.
          </Text>
        </>
      )}
    </Card>
  );
}

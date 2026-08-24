"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";

import { Card, EmptyState, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { calculateGuestRsvpSummary } from "@/lib/wedding/guest-views";
import type { WeddingGuest, WeddingGuestRsvpStatus } from "@/types/wedding";

import { GuestRow } from "./guest-row";

type RsvpFilter = "all" | WeddingGuestRsvpStatus;

const FILTERS: { value: RsvpFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attending", label: "Attending" },
  { value: "not-attending", label: "Not attending" },
  { value: "not-responded", label: "Awaiting response" },
];

interface GuestListProps {
  guests: WeddingGuest[];
}

/**
 * The guest list's own summary + filter + list (Phase 2). RSVP counts are
 * derived from the current guest list (`calculateGuestRsvpSummary`), never
 * stored - the same "single source of truth" principle every other
 * summary in this feature follows.
 */
export function GuestList({ guests }: GuestListProps) {
  const [filter, setFilter] = useState<RsvpFilter>("all");
  const summary = calculateGuestRsvpSummary(guests);

  const filtered = useMemo(() => {
    if (filter === "all") return guests;
    return guests.filter((guest) => guest.rsvpStatus === filter);
  }, [guests, filter]);

  if (guests.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Start your guest list"
        description="Add your first guest above to start building your list."
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="standard" padding="lg">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <Text size="body-sm" tone="muted">
              Total
            </Text>
            <Heading as="h2" size="h3">
              {summary.totalGuests}
            </Heading>
          </div>
          <div>
            <Text size="body-sm" tone="muted">
              Attending
            </Text>
            <Heading as="h2" size="h3">
              {summary.attending}
            </Heading>
          </div>
          <div>
            <Text size="body-sm" tone="muted">
              Not attending
            </Text>
            <Heading as="h2" size="h3">
              {summary.notAttending}
            </Heading>
          </div>
          <div>
            <Text size="body-sm" tone="muted">
              Awaiting response
            </Text>
            <Heading as="h2" size="h3">
              {summary.notResponded}
            </Heading>
          </div>
        </div>
      </Card>

      <div className="inline-flex flex-wrap gap-1 rounded-md border border-line-subtle bg-surface-muted p-1" role="group" aria-label="Filter guests by RSVP status">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={cn(
              "h-9 rounded-sm px-4 text-body-sm font-medium transition-colors duration-150 ease-standard",
              filter === option.value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No guests match this filter" description="Try a different filter to see more of your list." className="py-14" />
      ) : (
        <Card variant="standard" padding="lg">
          <ul className="flex flex-col divide-y divide-line-subtle">
            {filtered.map((guest) => (
              <GuestRow key={guest.id} guest={guest} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

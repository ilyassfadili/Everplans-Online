import { Users } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import type { GuestRsvpSummary } from "@/types/wedding";

import { PanelHeader } from "./panel-header";

interface GuestSummaryProps {
  summary: GuestRsvpSummary;
}

/** The dashboard's concise RSVP glance (Phase 2: "do not overload the dashboard") - three counts and a link, everything else lives on the full guest list. */
export function GuestSummary({ summary }: GuestSummaryProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Users}
        title="Guests"
        action={
          <Button href="/app/wedding-planner/guests" variant="outline" size="sm">
            View guests
          </Button>
        }
      />

      {summary.totalGuests === 0 ? (
        <EmptyState
          icon={Users}
          title="Who's celebrating with you?"
          description="Add the people you can't imagine your day without, and keep track of who's confirmed."
          className="mt-4 py-10"
        />
      ) : (
        <div className="mt-4 flex flex-1 items-center justify-around gap-4 text-center">
          <div>
            <Text size="body-lg" weight="semibold" className="font-display text-h3 text-ink">
              {summary.totalGuests}
            </Text>
            <Text size="body-sm" tone="muted">
              Invited
            </Text>
          </div>
          <div>
            <Text size="body-lg" weight="semibold" className="font-display text-h3 text-ink">
              {summary.attending}
            </Text>
            <Text size="body-sm" tone="muted">
              Confirmed
            </Text>
          </div>
          <div>
            <Text size="body-lg" weight="semibold" className="font-display text-h3 text-ink">
              {summary.notResponded}
            </Text>
            <Text size="body-sm" tone="muted">
              Pending
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}

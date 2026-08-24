import { CalendarClock } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import { getTimelineStatus } from "@/lib/wedding/timeline";
import type { TimelineEntry } from "@/types/wedding";

import { PanelHeader } from "./panel-header";

function formatEntryDate(eventDate: string): string {
  const date = new Date(`${eventDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TimelinePreviewProps {
  entries: TimelineEntry[];
}

/** The dashboard's "what's coming next" glance at the timeline - read-only, no interactivity of its own, everything happens on the full timeline. */
export function TimelinePreview({ entries }: TimelinePreviewProps) {
  const upcoming = entries.filter((entry) => getTimelineStatus(entry.eventDate) !== "past").slice(0, 3);

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={CalendarClock}
        title="Timeline"
        action={
          <Button href="/app/wedding-planner/timeline" variant="outline" size="sm">
            View timeline
          </Button>
        }
      />

      {upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing on the horizon yet"
          description="The moments leading up to your day will show up here once you add them to your timeline."
          className="mt-4 py-10"
        />
      ) : (
        <ul className="mt-3 flex flex-1 flex-col divide-y divide-line-subtle">
          {upcoming.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
              <Text size="body" weight="medium" className="text-ink">
                {entry.title}
              </Text>
              <Text size="body-sm" tone="muted" className="shrink-0">
                {formatEntryDate(entry.eventDate)}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

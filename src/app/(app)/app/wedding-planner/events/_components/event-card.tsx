import { Badge, Card, Link, Text } from "@/components/ui";
import type { WeddingEvent, WeddingVenue } from "@/types/wedding";

function formatEventDate(eventDate: string, startTime: string | null): string {
  const date = new Date(`${eventDate}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!startTime) return dateLabel;

  const [hours, minutes] = startTime.split(":").map(Number);
  const timeLabel = new Date(0, 0, 0, hours, minutes).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} · ${timeLabel}`;
}

interface EventCardProps {
  event: WeddingEvent;
  venue: WeddingVenue | null;
}

/** One event in the list - name, type, date, and venue if assigned. Links to the event's own detail page for everything else (Phase 2: "progressive disclosure"). */
export function EventCard({ event, venue }: EventCardProps) {
  return (
    <Link href={`/app/wedding-planner/events/${event.id}`} variant="inline" className="block text-ink no-underline hover:text-ink">
      <Card variant="interactive" padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text size="body-lg" weight="semibold" className="text-ink">
              {event.name}
            </Text>
            <Text size="body-sm" tone="muted" className="mt-0.5">
              {formatEventDate(event.eventDate, event.startTime)}
              {venue && ` · ${venue.name}`}
            </Text>
          </div>
          {event.eventType && <Badge variant="outline">{event.eventType}</Badge>}
        </div>
      </Card>
    </Link>
  );
}

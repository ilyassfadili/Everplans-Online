import type { TimelineEntry, Wedding, WeddingEvent, WeddingImportantDate } from "@/types/wedding";

/**
 * Pure derivations over already-fetched data - no database access. Merges
 * the wedding date (`weddings.wedding_date`, the one stored source of
 * truth - see `20260825000000_wedding_timeline.sql`'s own comment),
 * user-created important dates, and wedding events (Prompt 5 Phase 2) into
 * one chronological list - an event's own date is represented here
 * directly, never copied into a second important-date row ("do not
 * create two conflicting sources of truth").
 */

export function buildTimeline(wedding: Wedding, importantDates: WeddingImportantDate[], events: WeddingEvent[] = []): TimelineEntry[] {
  const entries: TimelineEntry[] = importantDates.map((date) => ({
    id: date.id,
    title: date.title,
    description: date.description,
    eventDate: date.eventDate,
    eventTime: date.eventTime,
    kind: "important-date" as const,
  }));

  for (const event of events) {
    entries.push({
      id: event.id,
      title: event.name,
      description: event.description,
      eventDate: event.eventDate,
      eventTime: event.startTime,
      kind: "event" as const,
    });
  }

  if (wedding.weddingDate) {
    entries.push({
      id: `wedding-date-${wedding.id}`,
      title: `${wedding.partnerOneName} & ${wedding.partnerTwoName}'s wedding day`,
      description: null,
      eventDate: wedding.weddingDate,
      eventTime: null,
      kind: "wedding-date" as const,
    });
  }

  return entries.sort((a, b) => {
    const dateCompare = a.eventDate.localeCompare(b.eventDate);
    if (dateCompare !== 0) return dateCompare;
    // Timed entries before all-day ones on the same date, then by time.
    if (!a.eventTime && !b.eventTime) return 0;
    if (!a.eventTime) return 1;
    if (!b.eventTime) return -1;
    return a.eventTime.localeCompare(b.eventTime);
  });
}

export type TimelineStatus = "past" | "today" | "upcoming";

function todayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "Upcoming/today/past" derived from a plain calendar-day comparison - never stored, per the migration's own reasoning. */
export function getTimelineStatus(eventDate: string): TimelineStatus {
  const today = todayISODate();
  if (eventDate === today) return "today";
  return eventDate > today ? "upcoming" : "past";
}

/**
 * Whole calendar days until the wedding date, or `null` if it hasn't been
 * set (onboarding allows leaving it blank) - the dashboard's own
 * countdown, computed from the one stored `weddings.wedding_date` rather
 * than a second stored value.
 */
export function getDaysUntilWedding(weddingDate: string | null): number | null {
  if (!weddingDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${weddingDate}T00:00:00`);
  due.setHours(0, 0, 0, 0);

  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

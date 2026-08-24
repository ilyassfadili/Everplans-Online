const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/**
 * Parses a plain `YYYY-MM-DD` (Postgres `date`) as UTC and formats it - the
 * same construction `formatWeddingDate` uses, so a date never shifts a day
 * earlier for a viewer in a timezone behind UTC.
 */
export function formatTripDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

const bookingDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** A booking's date, e.g. "Mon, Jun 4, 2026" - used by both the bookings list and the dashboard's upcoming-booking summary, so the two can never format the same date differently. */
export function formatBookingDate(date: string): string {
  return bookingDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

const itineraryDayDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** A single itinerary day's date, e.g. "Mon, Jun 4" - the day-card heading format. */
export function formatItineraryDayDate(date: string): string {
  return itineraryDayDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

/** A date range for display - same month/year collapses to "Jun 4-9, 2026" instead of repeating both in full. */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(start);
    return `${month} ${start.getUTCDate()}-${end.getUTCDate()}, ${end.getUTCFullYear()}`;
  }

  return `${shortDateFormatter.format(start)} - ${dateFormatter.format(end)}`;
}

/** Whole nights between two `YYYY-MM-DD` dates - the trip's duration. */
export function calculateTripNights(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** Every `YYYY-MM-DD` date from `startDate` to `endDate`, inclusive - the itinerary's own day list, derived fresh from the trip's dates rather than stored (`ItineraryDay`'s own comment). */
export function enumerateTripDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`).getTime();

  for (let cursor = start.getTime(); cursor <= end; cursor += 86_400_000) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
  }

  return dates;
}

/** Formats a plain `HH:MM` (24-hour) as `9:30 AM` - the same construction `TimelineEntryRow`'s own time formatter uses. */
export function formatActivityTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(0, 0, 0, hours, minutes).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** A document's expiry, relative to today - `null` when no expiry date is tracked. */
export function formatExpiryStatus(expiryDate: string | null, referenceDate: Date = new Date()): string | null {
  if (!expiryDate) return null;

  const todayUtc = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
  const expiry = new Date(`${expiryDate}T00:00:00Z`).getTime();
  const daysUntil = Math.round((expiry - todayUtc) / 86_400_000);

  if (daysUntil < 0) return `Expired ${formatTripDate(expiryDate)}`;
  if (daysUntil === 0) return "Expires today";
  if (daysUntil <= 90) return `Expires in ${daysUntil} ${daysUntil === 1 ? "day" : "days"}`;
  return `Expires ${formatTripDate(expiryDate)}`;
}

export type TripTiming =
  | { state: "upcoming"; daysUntil: number }
  | { state: "ongoing" }
  | { state: "completed" };

/**
 * A trip's timing relative to today, computed at request time (server-side,
 * not live-ticking like `WeddingCountdown` - a trip is dated in whole days,
 * not a single instant, so a static "N days to go" is the honest
 * granularity here). `referenceDate` defaults to now but accepts an
 * override for predictable testing.
 */
export function getTripTiming(startDate: string, endDate: string, referenceDate: Date = new Date()): TripTiming {
  const todayUtc = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();

  if (todayUtc > end) return { state: "completed" };
  if (todayUtc >= start) return { state: "ongoing" };

  return { state: "upcoming", daysUntil: Math.round((start - todayUtc) / 86_400_000) };
}

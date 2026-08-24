import { Text } from "@/components/ui";
import type { LifeHabitLog } from "@/types/life-planner";

interface HabitHistoryProps {
  logs: LifeHabitLog[];
  /** How many trailing days to show, ending today. */
  days?: number;
}

/** A `Date` as local-calendar `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * The habit detail page's own "last N days" history (Phase 3 §5) - a plain
 * row of small filled/unfilled dots, one per day, deliberately not a
 * calendar heatmap grid - "no excessive analytics/gamification" (Phase 3's
 * own instruction), the same register `HabitProgressBar`'s own comment
 * documents. Each dot's native `title` attribute names the actual date, so
 * the row stays glanceable without needing a legend of its own.
 */
export function HabitHistory({ logs, days = 14 }: HabitHistoryProps) {
  const loggedDates = new Set(logs.map((log) => log.loggedOn));
  const today = new Date();

  const entries = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - index));
    const iso = toIso(date);
    return {
      iso,
      logged: loggedDates.has(iso),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  return (
    <div className="flex flex-col gap-2">
      <Text size="body-sm" tone="muted">
        Last {days} days
      </Text>
      <div className="flex flex-wrap gap-1.5">
        {entries.map((entry) => (
          <span
            key={entry.iso}
            title={entry.logged ? `Logged ${entry.label}` : entry.label}
            className={entry.logged ? "size-3.5 rounded-full bg-success" : "size-3.5 rounded-full border border-line-subtle bg-surface-muted"}
          />
        ))}
      </div>
    </div>
  );
}

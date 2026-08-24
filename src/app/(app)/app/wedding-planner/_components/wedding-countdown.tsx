"use client";

import { useRef, useSyncExternalStore } from "react";

import { Card, Text } from "@/components/ui";
import { WeddingFlourish } from "@/components/wedding/wedding-flourish";

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const UNITS: { key: keyof CountdownParts; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

function computeCountdown(weddingDate: string): CountdownParts | null {
  // Local midnight, not UTC - unlike `formatWeddingDate` (which deliberately
  // parses as UTC so the *displayed calendar day* never shifts for a viewer
  // in a different timezone), a live countdown should tick down to when the
  // couple's own clock reaches their wedding day, not some fixed UTC instant.
  const target = new Date(`${weddingDate}T00:00:00`).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function subscribeToClockTick(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function partsEqual(a: CountdownParts, b: CountdownParts): boolean {
  return a.days === b.days && a.hours === b.hours && a.minutes === b.minutes && a.seconds === b.seconds;
}

/**
 * A live, ticking "time until the wedding." Built on `useSyncExternalStore`
 * - React's own primitive for subscribing to a value that changes outside
 * React's state (the system clock via `setInterval`) - rather than a
 * `useState` + `useEffect` combo that would call `setState` synchronously
 * inside the effect body, a pattern `eslint-plugin-react-hooks` flags for
 * good reason (cascading renders). The server snapshot is always
 * `undefined`: the server can't know "now" without producing a number
 * that's already stale by the time the client hydrates, so this renders a
 * calm placeholder until the client takes over - the same
 * mismatch-avoidance shape `Reveal` uses elsewhere in this codebase.
 */
export function WeddingCountdown({ weddingDate }: { weddingDate: string | null }) {
  // `useSyncExternalStore` requires `getSnapshot` to return a *stable*
  // reference when nothing has actually changed - `computeCountdown`
  // allocates a fresh object every call, so returning it unconditionally
  // makes every snapshot check look like a change, which is an infinite
  // render loop, not just a performance smell. This cache returns the
  // previous object back out whenever the wedding date and every displayed
  // digit still match, and only allocates (and caches) a new one the
  // second something real changes.
  const cacheRef = useRef<{ weddingDate: string | null; value: CountdownParts | null }>({
    weddingDate: null,
    value: null,
  });

  const countdown = useSyncExternalStore(
    subscribeToClockTick,
    () => {
      const next = weddingDate ? computeCountdown(weddingDate) : null;
      const cached = cacheRef.current;
      const unchanged =
        cached.weddingDate === weddingDate &&
        (cached.value === next ||
          (cached.value !== null && next !== null && partsEqual(cached.value, next)));

      if (unchanged) return cached.value;

      cacheRef.current = { weddingDate, value: next };
      return next;
    },
    () => undefined,
  );

  return (
    <Card
      variant="standard"
      padding="lg"
      className="relative flex h-full flex-col items-center justify-center gap-1 overflow-hidden text-center"
    >
      <WeddingFlourish className="pointer-events-none absolute -right-3 -top-3 h-28 w-20 text-brand/[0.06]" />
      <Text size="body-sm" tone="muted" weight="medium">
        {weddingDate && countdown !== null ? "Your wedding is in" : "Your wedding day"}
      </Text>

      {countdown === undefined ? (
        // Not measured yet (first paint, or no JS) - a calm blank space
        // reserves the layout without ever showing a fabricated number.
        <div className="h-16" aria-hidden="true" />
      ) : !weddingDate ? (
        <Text tone="muted" className="mt-2 max-w-xs">
          Add your wedding date on the timeline to start the countdown.
        </Text>
      ) : countdown === null ? (
        <p className="mt-1 font-display text-h2 text-ink">Today&rsquo;s the day</p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-6">
          {UNITS.map((unit) => (
            <div key={unit.key} className="flex flex-col items-center gap-1">
              <span className="font-display text-h2 tabular-nums text-ink sm:text-h1">
                {String(countdown[unit.key]).padStart(2, "0")}
              </span>
              <span className="text-caption text-ink-faint">{unit.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

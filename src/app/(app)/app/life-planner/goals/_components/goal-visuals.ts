import type { LifeGoalPriority, LifeGoalStatus } from "@/types/life-planner";

/**
 * Resolves a Life Goal's serializable `status`/`priority` into label + badge
 * tint, the same "data carries a string key, a lookup map resolves it"
 * split `AREA_ICONS`/`AREA_COLOR_CHIP_CLASS`
 * (`@/app/(app)/app/life-planner/areas/_components/area-visuals`) already
 * establishes for Life Areas. Plain, framework-agnostic module (no
 * `"use client"`) so the list page (Server Component), its client-side
 * cards/forms, and the detail view can all import it directly.
 */

export const STATUS_LABEL: Record<LifeGoalStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  paused: "Paused",
};

/** `paused` reads as `neutral`, not `warning` - "paused" is a state, not a problem, matching the same tone Habits/Routines already use for their own paused badge (`habit-card.tsx`, `routine-card.tsx`, and their detail views all render `<Badge variant="neutral">Paused</Badge>` directly). */
export const STATUS_BADGE: Record<LifeGoalStatus, "neutral" | "brand" | "success"> = {
  not_started: "neutral",
  in_progress: "brand",
  completed: "success",
  paused: "neutral",
};

export const STATUS_OPTIONS: { value: LifeGoalStatus; label: string }[] = [
  { value: "not_started", label: STATUS_LABEL.not_started },
  { value: "in_progress", label: STATUS_LABEL.in_progress },
  { value: "completed", label: STATUS_LABEL.completed },
  { value: "paused", label: STATUS_LABEL.paused },
];

export const PRIORITY_LABEL: Record<LifeGoalPriority, string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
};

export const PRIORITY_OPTIONS: { value: LifeGoalPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/** `outline` (a plain bordered chip) for `low`/`medium` - priority isn't a status, so it never borrows the same green/amber/brand tints `STATUS_BADGE` uses; only `high` gets a warning tint, to draw the eye without implying something's wrong. */
export const PRIORITY_BADGE: Record<LifeGoalPriority, "outline" | "warning"> = {
  low: "outline",
  medium: "outline",
  high: "warning",
};

/** Same local-midnight parse + short format every date display in this codebase uses (`DatePicker`'s own `dateFormatter`, `formatExpenseDate`) - never `toISOString()`, which is UTC and can land on the wrong day near midnight. */
export function formatGoalDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

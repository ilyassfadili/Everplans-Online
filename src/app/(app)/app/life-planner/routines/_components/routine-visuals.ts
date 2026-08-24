import type { LifeRoutine, LifeRoutineFrequency, LifeRoutineType } from "@/types/life-planner";

/**
 * Resolves a Routine's serializable `routineType`/`frequency` into label
 * (and, for `frequency`, a plain-language description), the same "data
 * carries a string key, a lookup map resolves it" split
 * `STATUS_LABEL`/`STATUS_BADGE` (`@/app/(app)/app/life-planner/goals/_components/goal-visuals`)
 * already establishes for Life Goals. Plain, framework-agnostic module (no
 * `"use client"`) so the list page (Server Component), its client-side
 * cards/forms, and the detail view can all import it directly.
 */

export const ROUTINE_TYPE_LABEL: Record<LifeRoutineType, string> = {
  morning: "Morning",
  evening: "Evening",
  weekly: "Weekly",
  custom: "Custom",
};

export const ROUTINE_TYPE_OPTIONS: { value: LifeRoutineType; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
];

export const FREQUENCY_LABEL: Record<LifeRoutineFrequency, string> = {
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Weekly",
  custom: "Custom days",
};

export const FREQUENCY_OPTIONS: { value: LifeRoutineFrequency; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays (Mon-Fri)" },
  { value: "weekly", label: "Weekly (choose a day)" },
  { value: "custom", label: "Custom days" },
];

/** Short day-of-week labels, indexed 0=Sunday..6=Saturday - the same convention `active_days` itself uses (matches `Date.prototype.getDay()`). */
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const DAY_OPTIONS: { value: number; label: string }[] = DAY_LABELS.map((label, value) => ({ value, label }));

/**
 * A routine's frequency, in plain language - "Every day" / "Weekdays" for
 * the two fixed frequencies, or the actual days chosen ("Mon, Wed, Fri")
 * for `"weekly"`/`"custom"`, since neither of those two on its own says
 * *which* days without reading `activeDays` (see `isRoutineDueToday`,
 * `@/lib/life-planner/life-routines`, for why both reduce to the same
 * day-list check).
 */
export function describeRoutineFrequency(routine: Pick<LifeRoutine, "frequency" | "activeDays">): string {
  if (routine.frequency === "daily") return FREQUENCY_LABEL.daily;
  if (routine.frequency === "weekdays") return FREQUENCY_LABEL.weekdays;

  if (routine.activeDays.length === 0) {
    return "No days chosen yet";
  }

  return [...routine.activeDays].sort((a, b) => a - b).map((day) => DAY_LABELS[day]).join(", ");
}

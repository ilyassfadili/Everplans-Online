import type { HabitProgress } from "@/lib/life-planner/life-habits";
import type { LifeHabit, LifeHabitFrequency } from "@/types/life-planner";

/**
 * Resolves a Habit's serializable `frequency` (and its own
 * `computeHabitProgress` output) into plain language, the same "data
 * carries a string key, a lookup map/formatter resolves it" split
 * `routine-visuals.ts` already establishes for Routines. Plain,
 * framework-agnostic module (no `"use client"`) so list pages (Server
 * Components), their client-side cards/forms, and detail views can all
 * import it directly.
 */

export const FREQUENCY_LABEL: Record<LifeHabitFrequency, string> = {
  daily: "Every day",
  weekly: "Once a week",
  x_per_week: "Multiple times a week",
};

export const FREQUENCY_OPTIONS: { value: LifeHabitFrequency; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Once a week" },
  { value: "x_per_week", label: "A number of times a week" },
];

/**
 * A Habit's frequency in plain language - "Every day" for `"daily"`,
 * "Once a week" for `"weekly"` when its own `targetPerPeriod` is `1` (the
 * common case a fresh "weekly" habit starts at), or "N times a week" for
 * anything higher / for `"x_per_week"` outright, since that frequency only
 * exists to say "more than once."
 */
export function describeHabitFrequency(habit: Pick<LifeHabit, "frequency" | "targetPerPeriod">): string {
  if (habit.frequency === "daily") return FREQUENCY_LABEL.daily;
  if (habit.frequency === "weekly" && habit.targetPerPeriod <= 1) return FREQUENCY_LABEL.weekly;
  return `${habit.targetPerPeriod}x a week`;
}

/** This period's progress in plain language - "Done today" / "Not done yet" for `"daily"`, "2/3 this week" for `"weekly"`/`"x_per_week"`. */
export function describeHabitProgress(habit: Pick<LifeHabit, "frequency">, progress: Pick<HabitProgress, "completedInPeriod" | "targetInPeriod">): string {
  if (habit.frequency === "daily") {
    return progress.completedInPeriod > 0 ? "Done today" : "Not done yet today";
  }
  return `${progress.completedInPeriod}/${progress.targetInPeriod} this week`;
}

/** "3-day streak" / "1-day streak" / no streak at all - `null` when `currentStreak` is `0`, since "a 0-day streak" isn't worth stating (the same "only render what's actually meaningful" instinct `UpcomingTargetDates` applies to its own empty case). */
export function describeHabitStreak(habit: Pick<LifeHabit, "frequency">, currentStreak: number): string | null {
  if (currentStreak <= 0) return null;
  const unit = habit.frequency === "daily" ? "day" : "week";
  return `${currentStreak}-${unit} streak`;
}

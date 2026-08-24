"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Pause, Play, Trash2 } from "lucide-react";

import { Badge, Button, Card, Icon, Link, Text } from "@/components/ui";
import type { HabitProgress } from "@/lib/life-planner/life-habits";
import type { LifeArea, LifeGoal, LifeHabit } from "@/types/life-planner";

import { toggleHabitLogForDateAction, activateHabitAction, deactivateHabitAction, deleteHabitAction } from "../actions";
import { HabitProgressBar } from "./habit-progress-bar";
import { describeHabitFrequency, describeHabitProgress, describeHabitStreak } from "./habit-visuals";

interface HabitCardProps {
  habit: LifeHabit;
  area: LifeArea | null;
  goal: LifeGoal | null;
  /** `null` for a paused habit - `getHabitsProgressForCurrentUser` (this card's own data source) only computes progress for active habits, the same "paused stops appearing in today's tracking" role `isRoutineDueToday` plays for Routines. A paused habit's card still renders (name, chips, resume/remove), just without the progress row or log toggle. */
  progress: HabitProgress | null;
  todayLogged: boolean;
  /** Today's local date as `YYYY-MM-DD`, computed server-side (the list/dashboard page) so every log toggle stamps the same day the server used to compute `progress`. */
  today: string;
}

/**
 * One Habit card - the Habits list page's own summary tile (Phase 3 §5):
 * name, Life Area/goal chips, frequency in plain language, today's log
 * toggle, current streak, this-period progress (a short "2/3 this week"
 * line plus `HabitProgressBar` - deliberately not a calendar heatmap, the
 * same "no excessive analytics/gamification" register `HabitProgressBar`'s
 * own comment documents), and a pause/resume toggle plus delete, all
 * without leaving the list. Editing the habit's own fields happens on its
 * detail page (linked via the name), the same "list card is a summary +
 * light actions, the detail page is where you edit" split `RoutineCard`
 * already establishes.
 */
export function HabitCard({ habit, area, goal, progress, todayLogged, today }: HabitCardProps) {
  const [isLogged, setIsLogged] = useState(todayLogged);
  const [isToggling, setIsToggling] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleLog() {
    // Optimistic - flips immediately, then reconciles with the server's own
    // answer, the same shape `RoutineGroup`'s completion toggle uses.
    setIsToggling(true);
    setIsLogged((current) => !current);
    const result = await toggleHabitLogForDateAction(habit.id, today);
    setIsToggling(false);
    if (result.status === "success") {
      setIsLogged(result.logged);
    } else {
      setIsLogged((current) => !current);
      setError(result.message ?? "Couldn't update that habit.");
    }
  }

  async function handleToggleActive() {
    setIsTogglingActive(true);
    const result = habit.isActive ? await deactivateHabitAction(habit.id) : await activateHabitAction(habit.id);
    setIsTogglingActive(false);
    setError(result.status === "success" ? null : (result.message ?? "Couldn't update that habit."));
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${habit.name}"? This can't be undone.`)) return;
    setIsDeleting(true);
    const result = await deleteHabitAction(habit.id);
    setIsDeleting(false);
    if (result.status !== "success") setError(result.message ?? "Couldn't remove that habit.");
  }

  const streakLabel = progress ? describeHabitStreak(habit, progress.currentStreak) : null;

  return (
    <Card variant="standard" padding="lg" className={`flex flex-col gap-4 ${habit.isActive ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/app/life-planner/habits/${habit.id}`} variant="inline" className="text-body-lg font-semibold text-ink no-underline hover:underline">
            {habit.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {area && <Badge variant="outline">{area.name}</Badge>}
            {goal && <Badge variant="outline">{goal.title}</Badge>}
            {!habit.isActive && <Badge variant="neutral">Paused</Badge>}
          </div>
        </div>

        {habit.isActive && (
          <button
            type="button"
            onClick={() => void handleToggleLog()}
            disabled={isToggling}
            aria-label={isLogged ? `Mark "${habit.name}" not done today` : `Mark "${habit.name}" done today`}
            className="shrink-0 disabled:opacity-60"
          >
            <Icon icon={isLogged ? CheckCircle2 : Circle} size="lg" className={isLogged ? "text-success" : "text-ink-faint"} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Text size="body-sm" tone="muted">
          {describeHabitFrequency(habit)}
        </Text>

        {progress && (
          <>
            <div className="flex items-center justify-between gap-2">
              <Text size="body-sm" tone="faint">
                {describeHabitProgress(habit, progress)}
              </Text>
              {streakLabel && (
                <Text size="body-sm" tone="faint">
                  {streakLabel}
                </Text>
              )}
            </div>
            <HabitProgressBar completed={progress.completedInPeriod} target={progress.targetInPeriod} />
          </>
        )}
      </div>

      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}

      <div className="mt-auto flex items-center gap-1 border-t border-line-subtle pt-3">
        <Button variant="ghost" size="sm" onClick={() => void handleToggleActive()} loading={isTogglingActive}>
          {habit.isActive ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {habit.isActive ? "Pause" : "Resume"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleDelete()} loading={isDeleting}>
          <Trash2 className="size-4" aria-hidden="true" />
          Remove
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { Button, Card, EmptyState, Heading, Icon, Link, Text } from "@/components/ui";
import type { HabitWithProgress } from "@/lib/life-planner/life-habits";

import { toggleHabitLogForDateAction } from "../habits/actions";
import { HabitProgressBar } from "../habits/_components/habit-progress-bar";
import { describeHabitStreak } from "../habits/_components/habit-visuals";

interface TodaysHabitsSectionProps {
  habitsProgress: HabitWithProgress[];
  /** Today's local date as `YYYY-MM-DD`, computed server-side (`page.tsx`) so every log toggle in this section stamps the same day the server used to compute `habitsProgress` - the same reasoning `TodaysRoutinesSection`'s own `today` prop documents. */
  today: string;
}

/**
 * The dashboard's own "Habits" half of the combined "Today's habits &
 * routines" section (Phase 3 §7) - the real content that replaces what was
 * `TodaysRoutinesSection`'s own passing "Habit tracking is coming soon"
 * mention. Every active habit (`getHabitsProgressForCurrentUser`,
 * `@/lib/life-planner/life-habits`), each rendered as a compact row with a
 * today's-log toggle, a short "2/3 this week" progress line via
 * `HabitProgressBar`, and its current streak - a glanceable, actionable
 * summary, the same "preview, not editor" role `TodaysRoutinesSection`
 * plays for Routines.
 */
export function TodaysHabitsSection({ habitsProgress, today }: TodaysHabitsSectionProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h3" size="h4">
          Habits
        </Heading>
        <Link href="/app/life-planner/habits" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
          View all habits
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {habitsProgress.length === 0 ? (
        <EmptyState
          title="No habits yet"
          description="Habits you're tracking will show up here, with today's log front and center."
          action={
            <Button href="/app/life-planner/habits/new" size="sm" variant="outline">
              New habit
            </Button>
          }
          className="mt-4 py-6"
        />
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {habitsProgress.map((entry) => (
            <HabitRow key={entry.habit.id} entry={entry} today={today} />
          ))}
        </div>
      )}
    </Card>
  );
}

function HabitRow({ entry, today }: { entry: HabitWithProgress; today: string }) {
  const { habit, progress } = entry;
  const [isLogged, setIsLogged] = useState(entry.todayLogged);
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
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
    }
  }

  const streakLabel = describeHabitStreak(habit, progress.currentStreak);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={isToggling}
          aria-label={isLogged ? `Mark "${habit.name}" not done today` : `Mark "${habit.name}" done today`}
          className="flex min-w-0 items-center gap-2 text-left disabled:opacity-60"
        >
          <Icon icon={isLogged ? CheckCircle2 : Circle} size="sm" className={isLogged ? "shrink-0 text-success" : "shrink-0 text-ink-faint"} />
          <Text size="body-sm" className={isLogged ? "truncate text-ink-muted line-through" : "truncate text-ink"}>
            {habit.name}
          </Text>
        </button>
        {streakLabel && (
          <Text size="body-sm" tone="faint" className="shrink-0">
            {streakLabel}
          </Text>
        )}
      </div>
      <HabitProgressBar completed={progress.completedInPeriod} target={progress.targetInPeriod} />
    </div>
  );
}

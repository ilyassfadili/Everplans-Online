"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { Icon, Link, Text } from "@/components/ui";
import type { LifeHabit } from "@/types/life-planner";

import { toggleHabitLogForDateAction } from "../../../habits/actions";
import { describeHabitFrequency } from "../../../habits/_components/habit-visuals";

interface GoalHabitsProps {
  habits: LifeHabit[];
  /** Today's logged state per habit id - computed server-side (`page.tsx`, via `getHabitsProgressForCurrentUser`) so this section's initial state matches the day the server rendered it against, the same reasoning `TodaysRoutinesSection`'s own `today` prop documents. */
  todayLoggedByHabitId: Record<string, boolean>;
  today: string;
}

/**
 * The goal detail page's own compact "Habits for this goal" section (Life
 * Planner Prompt 3 Phase 3 §6) - a plain list with a today's-log toggle per
 * row, the same "list card is a summary + light actions, the detail page is
 * where you edit" role `GoalTasks` already plays for Life Tasks one card up
 * - editing or pausing a habit still happens on its own detail page (linked
 * per row). No inline "add habit" form here either - "Manage habits" links
 * to the real Habits list, which already has one.
 */
export function GoalHabits({ habits, todayLoggedByHabitId, today }: GoalHabitsProps) {
  return (
    <div className="flex flex-col gap-3">
      {habits.length === 0 ? (
        <Text size="body-sm" tone="muted">
          No habits linked to this goal yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {habits.map((habit) => (
            <GoalHabitRow key={habit.id} habit={habit} todayLogged={todayLoggedByHabitId[habit.id] ?? false} today={today} />
          ))}
        </div>
      )}

      <Link href="/app/life-planner/habits" variant="subtle" className="self-start text-body-sm">
        Manage habits →
      </Link>
    </div>
  );
}

function GoalHabitRow({ habit, todayLogged, today }: { habit: LifeHabit; todayLogged: boolean; today: string }) {
  const [isToggling, setIsToggling] = useState(false);
  const [isLogged, setIsLogged] = useState(todayLogged);

  async function handleToggle() {
    // Optimistic - flips immediately, then reconciles with the server's own
    // answer, the same shape `GoalTaskRow`'s completion toggle uses.
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

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface p-3">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={isToggling}
          aria-label={isLogged ? `Mark "${habit.name}" not done today` : `Mark "${habit.name}" done today`}
          className="shrink-0 disabled:opacity-60"
        >
          <Icon icon={isLogged ? CheckCircle2 : Circle} size="sm" className={isLogged ? "text-success" : "text-ink-faint"} />
        </button>
        <Link
          href={`/app/life-planner/habits/${habit.id}`}
          variant="inline"
          className={`truncate text-body-sm font-medium no-underline hover:underline ${isLogged ? "text-ink-muted line-through" : "text-ink"}`}
        >
          {habit.name}
        </Link>
      </div>
      <Text size="body-sm" tone="faint" className="shrink-0">
        {describeHabitFrequency(habit)}
      </Text>
    </div>
  );
}

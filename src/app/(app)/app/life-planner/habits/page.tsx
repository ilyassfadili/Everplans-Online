import type { Metadata } from "next";
import { Repeat } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { getHabitsForCurrentUser, getHabitsProgressForCurrentUser } from "@/lib/life-planner/life-habits";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../_components/page-header";
import { HabitCard } from "./_components/habit-card";

export const metadata: Metadata = {
  title: "Habits",
  robots: { index: false, follow: false },
};

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). Computed once here, server-side, and handed to every `HabitCard` so its log toggle stamps the exact day this same render used to compute progress. */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * The dedicated Habits page (Life Planner Prompt 3 Phase 3) - every habit
 * the user has, active ones first (`getHabitsForCurrentUser`'s own order),
 * each as a summary card with today's log toggle, streak, this-period
 * progress, and a pause/resume toggle plus delete. Same "confirm the root
 * workspace exists, auto-provision if not, then redirect back" gate every
 * other Life Planner route uses, since this route can be reached directly
 * without ever passing through the dashboard first.
 *
 * Progress is only computed for active habits
 * (`getHabitsProgressForCurrentUser`'s own scope) - a paused habit's card
 * still renders, just without a progress row (see `HabitCard`'s own
 * comment on its `progress: HabitProgress | null` prop).
 */
export default async function HabitsPage() {
  await requireLifePlanForCurrentUser();

  const [habits, progressList, areas, goals] = await Promise.all([
    getHabitsForCurrentUser(),
    getHabitsProgressForCurrentUser(),
    getLifeAreasForCurrentUser(),
    getLifeGoalsForCurrentUser(),
  ]);

  const areaById = new Map(areas.map((area) => [area.id, area]));
  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const progressByHabitId = new Map(progressList.map((entry) => [entry.habit.id, entry]));
  const today = todayIso();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Habits"
        description="Recurring behaviors you want to keep up with - track them daily or a set number of times a week."
        action={
          <Button href="/app/life-planner/habits/new" size="sm">
            New habit
          </Button>
        }
      />

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Create your first habit to start building a track record."
          action={<Button href="/app/life-planner/habits/new">New habit</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => {
            const area = habit.lifeAreaId ? (areaById.get(habit.lifeAreaId) ?? null) : null;
            const goal = habit.goalId ? (goalById.get(habit.goalId) ?? null) : null;
            const entry = progressByHabitId.get(habit.id);
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                area={area}
                goal={goal}
                progress={entry?.progress ?? null}
                todayLogged={entry?.todayLogged ?? false}
                today={today}
              />
            );
          })}
        </div>
      )}
    </Container>
  );
}

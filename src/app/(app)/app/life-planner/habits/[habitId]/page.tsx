import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { computeHabitProgress, getHabitById, getHabitLogsInRange } from "@/lib/life-planner/life-habits";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { HabitDetailView } from "./_components/habit-detail-view";

interface HabitDetailPageProps {
  params: Promise<{ habitId: string }>;
}

export const metadata: Metadata = {
  title: "Habit",
  robots: { index: false, follow: false },
};

/** Wide enough to always cover the current period (day or week) plus a healthy streak - the same lookback window `getHabitsProgressForCurrentUser` uses for the list/dashboard. */
const LOOKBACK_DAYS = 60;

/** A `Date` as local-calendar `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * One Habit's detail view (Phase 3 §5) - the redirect-to-detail destination
 * `createHabitFormAction` sends a new habit to, and the destination
 * `HabitCard` links every habit in the list to. `getHabitById` is already
 * owner-scoped (see that function's own comment), so a `null` result covers
 * both "doesn't exist" and "belongs to someone else" with the same honest
 * 404 every other Life Planner detail page uses.
 *
 * Progress and the history strip both derive from the same
 * `LOOKBACK_DAYS`-day window of logs, fetched once here rather than twice -
 * `computeHabitProgress` is a pure function (no database call of its own),
 * so this page is the one place that both fetches the raw logs and derives
 * everything `HabitDetailView` needs from them.
 */
export default async function HabitDetailPage({ params }: HabitDetailPageProps) {
  const { habitId } = await params;
  await requireLifePlanForCurrentUser();

  const habit = await getHabitById(habitId);
  if (!habit) {
    notFound();
  }

  const referenceDate = new Date();
  const lookbackStart = new Date(referenceDate);
  lookbackStart.setDate(lookbackStart.getDate() - LOOKBACK_DAYS);

  const [areas, goals, logs] = await Promise.all([
    getLifeAreasForCurrentUser(),
    getLifeGoalsForCurrentUser(),
    getHabitLogsInRange(habitId, toIso(lookbackStart), toIso(referenceDate)),
  ]);

  const area = habit.lifeAreaId ? (areas.find((candidate) => candidate.id === habit.lifeAreaId) ?? null) : null;
  const goal = habit.goalId ? (goals.find((candidate) => candidate.id === habit.goalId) ?? null) : null;
  const progress = computeHabitProgress(habit, logs, referenceDate);
  const todaysIso = toIso(referenceDate);
  const todayLogged = logs.some((log) => log.loggedOn === todaysIso);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/life-planner/habits" variant="subtle" className="text-body-sm">
        ← All habits
      </Link>
      <HabitDetailView
        habit={habit}
        areas={areas}
        goals={goals}
        area={area}
        goal={goal}
        progress={progress}
        todayLogged={todayLogged}
        logs={logs}
        today={todaysIso}
      />
    </Container>
  );
}

import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Container, Heading, Icon, Link, Text } from "@/components/ui";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import {
  addWeeks,
  getOrCreateWeeklyPlan,
  getWeekEnd,
  getWeekStartForDate,
  getWeekSummary,
  getWeeklyPrioritiesForPlan,
} from "@/lib/life-planner/life-planning";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getTasksForCurrentUser } from "@/lib/life-planner/life-tasks";

import { PlanNotesForm } from "../_components/plan-notes-form";
import { PlanPriorities } from "../_components/plan-priorities";
import { PlanningViewSwitch } from "../_components/planning-view-switch";
import { WeekSummaryView } from "./_components/week-summary-view";
import { addWeeklyPriorityFormAction, deleteWeeklyPriorityAction, moveWeeklyPriorityAction, toggleWeeklyPriorityAction, updateWeeklyPlanNotesFormAction } from "./actions";

export const metadata: Metadata = {
  title: "Weekly Planning",
  robots: { index: false, follow: false },
};

interface WeeklyPlanningPageProps {
  searchParams: Promise<{ week?: string }>;
}

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Parses `?week=` into a normalized Monday-start ISO date - an invalid or missing value both fall back to the current week, and any valid date (not just a Monday) is normalized to *its own* week's Monday via `getWeekStartForDate`, so a hand-edited URL always lands on a real week rather than erroring. */
function parseWeekParam(value: string | undefined): string {
  if (value) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return getWeekStartForDate(parsed);
    }
  }
  return getWeekStartForDate(new Date());
}

function formatDateLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * The Weekly Planning page (Life Planner Prompt 4 Phase 1 §4) - an
 * aggregation/curation layer over existing Goals/Tasks/Habits/Routines data
 * plus a thin layer of user-authored priorities/notes, never a second place
 * to edit any of those. `?week=YYYY-MM-DD` (any date within the target
 * week - normalized via `getWeekStartForDate`) picks which week; omitted,
 * it defaults to the current week. Same "confirm the root workspace
 * exists, auto-provision if not, then redirect back" gate the
 * Tasks/Goals/Routines/Habits pages already use, since this route can be
 * reached directly without ever passing through the dashboard first -
 * `getOrCreateWeeklyPlan` then provisions *this specific week's* plan row
 * the same on-demand way, with no separate setup step of its own.
 */
export default async function WeeklyPlanningPage({ searchParams }: WeeklyPlanningPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;
  const weekStart = parseWeekParam(params.week);
  const weekEnd = getWeekEnd(weekStart);

  const plan = await getOrCreateWeeklyPlan(weekStart);

  const [priorities, summary, goals, tasks] = await Promise.all([
    getWeeklyPrioritiesForPlan(plan.id),
    getWeekSummary(weekStart, weekEnd),
    getLifeGoalsForCurrentUser(),
    getTasksForCurrentUser(),
  ]);

  const activeGoals = goals.filter((goal) => goal.status === "not_started" || goal.status === "in_progress");
  const openTasks = tasks.filter((task) => task.status !== "completed");

  const prevWeekStart = addWeeks(weekStart, -1);
  const nextWeekStart = addWeeks(weekStart, 1);
  const isCurrentWeek = weekStart === getWeekStartForDate(new Date());

  const addAction = addWeeklyPriorityFormAction.bind(null, plan.id);
  const notesAction = updateWeeklyPlanNotesFormAction.bind(null, plan.id);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4">
        <Heading as="h1" size="h2" className="hidden lg:block">
          Weekly Planning
        </Heading>
        <Text size="body-lg" tone="muted" className="max-w-xl">
          What matters this week, pulled together from your goals, tasks, habits, and routines.
        </Text>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/app/life-planner/planning/weekly?week=${prevWeekStart}`}
              variant="nav"
              aria-label="Previous week"
              className="rounded-md border border-line-subtle p-2 no-underline hover:bg-surface-muted"
            >
              <Icon icon={ChevronLeft} size="sm" />
            </Link>
            <div className="flex flex-col">
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatDateLabel(weekStart)} &ndash; {formatDateLabel(weekEnd)}
              </Text>
              {!isCurrentWeek && (
                <Link href="/app/life-planner/planning/weekly" variant="subtle" className="w-fit text-body-sm no-underline hover:underline">
                  Back to this week
                </Link>
              )}
            </div>
            <Link
              href={`/app/life-planner/planning/weekly?week=${nextWeekStart}`}
              variant="nav"
              aria-label="Next week"
              className="rounded-md border border-line-subtle p-2 no-underline hover:bg-surface-muted"
            >
              <Icon icon={ChevronRight} size="sm" />
            </Link>
          </div>

          <PlanningViewSwitch active="weekly" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          This week&rsquo;s priorities
        </Heading>
        <PlanPriorities
          priorities={priorities}
          goals={activeGoals}
          tasks={openTasks}
          emptyLabel="No priorities set for this week yet."
          addFormAction={addAction}
          onToggle={toggleWeeklyPriorityAction}
          onDelete={deleteWeeklyPriorityAction}
          onMove={moveWeeklyPriorityAction}
        />
      </div>

      <WeekSummaryView summary={summary} today={todayIso()} />

      <div className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          Notes
        </Heading>
        <PlanNotesForm initialNotes={plan.notes ?? ""} action={notesAction} placeholder="Anything you want to remember about this week..." />
      </div>
    </Container>
  );
}

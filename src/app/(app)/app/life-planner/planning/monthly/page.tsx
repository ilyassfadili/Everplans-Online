import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Container, Heading, Icon, Link, Text } from "@/components/ui";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import {
  addMonths,
  getMonthEnd,
  getMonthStartForDate,
  getMonthSummary,
  getMonthlyPrioritiesForPlan,
  getOrCreateMonthlyPlan,
} from "@/lib/life-planner/life-planning";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getTasksForCurrentUser } from "@/lib/life-planner/life-tasks";

import { PlanNotesForm } from "../_components/plan-notes-form";
import { PlanPriorities } from "../_components/plan-priorities";
import { PlanningViewSwitch } from "../_components/planning-view-switch";
import { MonthSummaryView } from "./_components/month-summary-view";
import { addMonthlyPriorityFormAction, deleteMonthlyPriorityAction, moveMonthlyPriorityAction, toggleMonthlyPriorityAction, updateMonthlyPlanNotesFormAction } from "./actions";

export const metadata: Metadata = {
  title: "Monthly Planning",
  robots: { index: false, follow: false },
};

interface MonthlyPlanningPageProps {
  searchParams: Promise<{ month?: string }>;
}

/** Parses `?month=` into a normalized 1st-of-month ISO date - an invalid or missing value both fall back to the current month, and any valid date (not just the 1st) is normalized to *its own* month's 1st via `getMonthStartForDate`, so a hand-edited URL always lands on a real month rather than erroring. */
function parseMonthParam(value: string | undefined): string {
  if (value) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return getMonthStartForDate(parsed);
    }
  }
  return getMonthStartForDate(new Date());
}

function formatMonthLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * The Monthly Planning page (Life Planner Prompt 4 Phase 1 §5) - the exact
 * same aggregation/curation role `WeeklyPlanningPage`
 * (`@/app/(app)/app/life-planner/planning/weekly/page.tsx`) plays, one
 * grain up. `?month=YYYY-MM-DD` (any date within the target month -
 * normalized via `getMonthStartForDate`) picks which month; omitted, it
 * defaults to the current month.
 */
export default async function MonthlyPlanningPage({ searchParams }: MonthlyPlanningPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;
  const monthStart = parseMonthParam(params.month);
  const monthEnd = getMonthEnd(monthStart);

  const plan = await getOrCreateMonthlyPlan(monthStart);

  const [priorities, summary, goals, tasks] = await Promise.all([
    getMonthlyPrioritiesForPlan(plan.id),
    getMonthSummary(monthStart, monthEnd),
    getLifeGoalsForCurrentUser(),
    getTasksForCurrentUser(),
  ]);

  const activeGoals = goals.filter((goal) => goal.status === "not_started" || goal.status === "in_progress");
  const openTasks = tasks.filter((task) => task.status !== "completed");

  const prevMonthStart = addMonths(monthStart, -1);
  const nextMonthStart = addMonths(monthStart, 1);
  const isCurrentMonth = monthStart === getMonthStartForDate(new Date());

  const addAction = addMonthlyPriorityFormAction.bind(null, plan.id);
  const notesAction = updateMonthlyPlanNotesFormAction.bind(null, plan.id);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4">
        <Heading as="h1" size="h2" className="hidden lg:block">
          Monthly Planning
        </Heading>
        <Text size="body-lg" tone="muted" className="max-w-xl">
          The bigger picture for this month, pulled together from your goals and tasks.
        </Text>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/app/life-planner/planning/monthly?month=${prevMonthStart}`}
              variant="nav"
              aria-label="Previous month"
              className="rounded-md border border-line-subtle p-2 no-underline hover:bg-surface-muted"
            >
              <Icon icon={ChevronLeft} size="sm" />
            </Link>
            <div className="flex flex-col">
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatMonthLabel(monthStart)}
              </Text>
              {!isCurrentMonth && (
                <Link href="/app/life-planner/planning/monthly" variant="subtle" className="w-fit text-body-sm no-underline hover:underline">
                  Back to this month
                </Link>
              )}
            </div>
            <Link
              href={`/app/life-planner/planning/monthly?month=${nextMonthStart}`}
              variant="nav"
              aria-label="Next month"
              className="rounded-md border border-line-subtle p-2 no-underline hover:bg-surface-muted"
            >
              <Icon icon={ChevronRight} size="sm" />
            </Link>
          </div>

          <PlanningViewSwitch active="monthly" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          This month&rsquo;s priorities
        </Heading>
        <PlanPriorities
          priorities={priorities}
          goals={activeGoals}
          tasks={openTasks}
          emptyLabel="No priorities set for this month yet."
          addFormAction={addAction}
          onToggle={toggleMonthlyPriorityAction}
          onDelete={deleteMonthlyPriorityAction}
          onMove={moveMonthlyPriorityAction}
        />
      </div>

      <MonthSummaryView summary={summary} />

      <div className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          Notes
        </Heading>
        <PlanNotesForm initialNotes={plan.notes ?? ""} action={notesAction} placeholder="Anything you want to remember about this month..." />
      </div>
    </Container>
  );
}

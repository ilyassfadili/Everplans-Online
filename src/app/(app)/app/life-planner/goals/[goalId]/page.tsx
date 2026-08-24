import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { AREA_ICONS } from "@/app/(app)/app/life-planner/areas/_components/area-visuals";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getActionStepsForGoal, getMilestonesForGoal } from "@/lib/life-planner/life-goal-planning";
import { getLifeGoalById } from "@/lib/life-planner/life-goals";
import { getHabitsForGoal, getHabitsProgressForCurrentUser } from "@/lib/life-planner/life-habits";
import { getImportantItemsForCurrentUser } from "@/lib/life-planner/life-important-items";
import { getJournalEntriesForCurrentUser } from "@/lib/life-planner/life-journal";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getTasksForGoal } from "@/lib/life-planner/life-tasks";

import { GoalDetailView } from "./_components/goal-detail-view";

interface GoalDetailPageProps {
  params: Promise<{ goalId: string }>;
}

export const metadata: Metadata = {
  title: "Goal",
  robots: { index: false, follow: false },
};

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * One Life Goal's detail view (Phase 2 §4) - the redirect-to-detail
 * destination `createLifeGoalFormAction` sends a new goal to, and the
 * destination `GoalCard` links every goal in the list to. `getLifeGoalById`
 * is already owner-scoped (see that function's own comment), so a
 * `null` result covers both "doesn't exist" and "belongs to someone else"
 * with the same honest 404 - no second workspace-membership check needed
 * the way `VendorDetailPage` needs one (a goal carries its own `owner_id`
 * directly, not a shared parent id to cross-check).
 */
export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { goalId } = await params;
  await requireLifePlanForCurrentUser();

  const goal = await getLifeGoalById(goalId);
  if (!goal) {
    notFound();
  }

  const [areas, milestones, actionSteps, tasks, habits, habitsProgress, journalEntries, importantItems] = await Promise.all([
    getLifeAreasForCurrentUser(),
    getMilestonesForGoal(goalId),
    getActionStepsForGoal(goalId),
    getTasksForGoal(goalId),
    getHabitsForGoal(goalId),
    getHabitsProgressForCurrentUser(),
    getJournalEntriesForCurrentUser({ goalId }),
    getImportantItemsForCurrentUser({ goalId }),
  ]);
  const area = goal.lifeAreaId ? (areas.find((candidate) => candidate.id === goal.lifeAreaId) ?? null) : null;
  // `getHabitsForGoal` already scopes to this goal's own active habits;
  // `getHabitsProgressForCurrentUser` is the only source for "was this
  // habit already logged today," so its result is looked up by id rather
  // than fetched a second time narrowed to this goal.
  const todayLoggedByHabitId = Object.fromEntries(habitsProgress.map((entry) => [entry.habit.id, entry.todayLogged]));

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/life-planner/goals" variant="subtle" className="text-body-sm">
        ← All goals
      </Link>
      <GoalDetailView
        goal={goal}
        areas={areas}
        area={area}
        areaIcon={area ? AREA_ICONS[area.iconKey] : null}
        milestones={milestones}
        actionSteps={actionSteps}
        tasks={tasks}
        habits={habits}
        todayLoggedByHabitId={todayLoggedByHabitId}
        journalEntries={journalEntries}
        importantItems={importantItems}
        today={todayIso()}
      />
    </Container>
  );
}

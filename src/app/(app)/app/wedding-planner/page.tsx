import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container, Reveal } from "@/components/ui";
import { calculateBudgetSummary } from "@/lib/wedding/budget";
import { getBudgetCategoriesForWedding } from "@/lib/wedding/budget-categories";
import { getExpensesForWedding } from "@/lib/wedding/expenses";
import { getEventsForWedding } from "@/lib/wedding/events";
import { calculateGuestRsvpSummary } from "@/lib/wedding/guest-views";
import { getGuestsForWedding } from "@/lib/wedding/guests";
import { getImportantDatesForWedding } from "@/lib/wedding/important-dates";
import { getMilestonesForWedding } from "@/lib/wedding/milestones";
import { getTasksNeedingAttention } from "@/lib/wedding/task-views";
import { getTasksForWedding } from "@/lib/wedding/tasks";
import { buildTimeline } from "@/lib/wedding/timeline";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { BudgetSummary } from "./_components/budget-summary";
import { ChecklistProgressCard } from "./_components/checklist-progress-card";
import { FocusPanel } from "./_components/focus-panel";
import { GuestSummary } from "./_components/guest-summary";
import { MilestonesPanel } from "./_components/milestones-panel";
import { TimelinePreview } from "./_components/timeline-preview";
import { WeddingCountdown } from "./_components/wedding-countdown";
import { WeddingHeader } from "./_components/wedding-header";

export const metadata: Metadata = {
  title: "Wedding Planner",
  robots: { index: false, follow: false },
};

/**
 * The Wedding Planner's dashboard - the workspace home from Prompt 1 Phase
 * 4, now built out into a real planning dashboard (Prompt 2 Phase 1: "do
 * not create a separate application shell", built on top of the existing
 * workspace route in place). `getWeddingForCurrentUser()` gates the route
 * (it calls `requireUser()` internally): no workspace yet sends the
 * visitor to onboarding.
 *
 * Progress is derived from the current task list at request time
 * (`calculateWeddingProgress`), never stored - there's exactly one source
 * of truth, and it can't drift from what the checklist itself shows.
 * Milestones and the "needs attention" task list are each real, honestly
 * empty until the couple adds their own - no seeded or fabricated content.
 */
export default async function WeddingPlannerPage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const [milestones, tasks, importantDates, events, categories, expenses, guests] = await Promise.all([
    getMilestonesForWedding(wedding.id),
    getTasksForWedding(wedding.id),
    getImportantDatesForWedding(wedding.id),
    getEventsForWedding(wedding.id),
    getBudgetCategoriesForWedding(wedding.id),
    getExpensesForWedding(wedding.id),
    getGuestsForWedding(wedding.id),
  ]);

  const completedTaskCount = tasks.filter((task) => task.status === "completed").length;
  const inProgressTaskCount = tasks.filter((task) => task.status === "in-progress").length;
  const notStartedTaskCount = tasks.filter((task) => task.status === "not-started").length;
  const attentionTasks = getTasksNeedingAttention(tasks);
  const timeline = buildTimeline(wedding, importantDates, events);
  const budgetSummary = calculateBudgetSummary(categories, expenses);
  const guestSummary = calculateGuestRsvpSummary(guests);

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:gap-8 md:py-14">
      <WeddingHeader wedding={wedding} />

      {/* Above-the-fold row: the plain CSS `animate-hero-in` keyframe, same
          as `WeddingHeader` itself - not `Reveal`, whose IntersectionObserver
          would fire "already in view" on mount for content that starts
          visible on load, showing a flash before revealing it right back
          (see `Reveal`'s own comment). */}
      <div className="grid animate-hero-in gap-6 lg:grid-cols-2" style={{ animationDelay: "80ms" }}>
        <WeddingCountdown weddingDate={wedding.weddingDate} />
        <ChecklistProgressCard
          completed={completedTaskCount}
          inProgress={inProgressTaskCount}
          notStarted={notStartedTaskCount}
        />
      </div>

      {/* No `items-start` here on purpose - CSS Grid's default `stretch`
          makes both cards in the row match the taller one's height, so
          e.g. a one-line Timeline card and a tall empty Budget card read as
          one aligned row instead of two mismatched boxes. Each panel's own
          `Card` is `flex h-full flex-col` so it actually fills that
          stretched height rather than just being handed a taller, unused
          box. Below-the-fold rows use `Reveal` (a below-fold fade + rise,
          staggered) rather than the hero's plain CSS animation - see that
          component's own comment for why the two aren't interchangeable. */}
      <Reveal className="grid gap-6 lg:grid-cols-2">
        <MilestonesPanel weddingId={wedding.id} milestones={milestones} />
        <FocusPanel tasks={attentionTasks} hasAnyTasks={tasks.length > 0} />
      </Reveal>

      <Reveal delay={70} className="grid gap-6 lg:grid-cols-2">
        <TimelinePreview entries={timeline} />
        <BudgetSummary summary={budgetSummary} currency={wedding.currency} hasAnyCategories={categories.length > 0} />
      </Reveal>

      <Reveal delay={140}>
        <GuestSummary summary={guestSummary} />
      </Reveal>
    </Container>
  );
}

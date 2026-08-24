import type { Metadata } from "next";

import { Button, Card, Container, EmptyState, Heading } from "@/components/ui";
import { LifeProfileSection } from "@/components/life-planner/life-profile-form";
import { ensureDefaultLifeAreas, getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getUpcomingTargetDatesForCurrentUser } from "@/lib/life-planner/life-goal-planning";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { getHabitsProgressForCurrentUser } from "@/lib/life-planner/life-habits";
import { getRecentImportantItemsForCurrentUser } from "@/lib/life-planner/life-important-items";
import { getRecentJournalEntriesForCurrentUser } from "@/lib/life-planner/life-journal";
import { getCurrentWeekPrioritiesForCurrentUser } from "@/lib/life-planner/life-planning";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getTodaysRoutineItemsForCurrentUser } from "@/lib/life-planner/life-routines";
import { getTodaysPrioritiesForCurrentUser } from "@/lib/life-planner/life-tasks";

import { GoalsSection } from "./_components/goals-section";
import { LifeAreasPreview } from "./_components/life-areas-preview";
import { LifePlannerHeader } from "./_components/life-planner-header";
import { RecentImportantItemsSection } from "./_components/recent-important-items-section";
import { RecentJournalSection } from "./_components/recent-journal-section";
import { TodaysHabitsSection } from "./_components/todays-habits-section";
import { TodaysPrioritiesSection } from "./_components/todays-priorities-section";
import { TodaysRoutinesSection } from "./_components/todays-routines-section";
import { UpcomingTargetDates } from "./_components/upcoming-target-dates";
import { WeeklyPlanningSection } from "./_components/weekly-planning-section";

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this product uses). Computed once here, server-side, and handed to `TodaysRoutinesSection` so its completion toggles stamp the exact day this same render decided "today's routines" against. */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const metadata: Metadata = {
  title: "Life Planner",
  robots: { index: false, follow: false },
};

/**
 * The Life Planner dashboard foundation (Phase 3). Phase 1 proved the
 * workspace route, auth gate, and `public.life_plans` data model; Phase 2
 * built the Life Profile view/edit experience as the page's entire body.
 * This phase builds the dashboard shell around it, the same way Travel
 * Planner's dashboard (`travel-planner/page.tsx`) wraps its real cards in a
 * header + sectioned layout rather than rendering one card alone.
 *
 * `LifeProfileSection` itself is untouched - it still owns the empty
 * prompt/read/edit toggle - it's just composed as one "Life Overview"
 * section within the larger page now, instead of being the whole page.
 * Phase 3 originally paired it with `FutureModulesSection`: calm, clearly
 * non-functional teaser tiles for the areas this workspace would grow into
 * (goals, priorities, habits, weekly/monthly planning, journal, important
 * information) - no fake data, no dead-end buttons, deliberately receding
 * beneath the real content so the page read as an intentional foundation
 * rather than a half-built app. Every one of those areas is now a real
 * system (see each Prompt/Phase below); `FutureModulesSection` itself was
 * removed once its last placeholder ("Important Plans & Information") was
 * replaced - see the Prompt 4 Phase 3 note further down.
 *
 * Auto-provisioning stays exactly as Phase 1 built it: a first visit with
 * no existing plan creates a bare row (every Life Profile field `null`) and
 * redirects back to this same route, which then renders `LifeProfileSection`'s
 * empty state instead of a second "let's get started" screen.
 *
 * Prompt 2 Phase 1 adds Life Areas as this page's second real system:
 * `ensureDefaultLifeAreas` seeds the 9 defaults the first time a plan's
 * areas are ever read (idempotent - a no-op on every later visit), and
 * `LifeAreasPreview` renders the result as a compact chip row directly
 * beneath Life Overview.
 *
 * Prompt 2 Phase 2 adds Goals as the third real system: `GoalsSection`
 * renders a compact preview of up to 3 active goals (or a real empty state
 * prompting the first one), which is why "Goals" no longer appears in
 * `FutureModulesSection`'s own placeholder list below - it would otherwise
 * read as the same feature promised twice.
 *
 * Prompt 2 Phase 3 adds one more, deliberately small addition beneath
 * `GoalsSection`: `UpcomingTargetDates`, a short list combining goal and
 * milestone target dates due in the next ~30 days
 * (`getUpcomingTargetDatesForCurrentUser`,
 * `@/lib/life-planner/life-goal-planning`). Rendered only when non-empty -
 * unlike every other section on this page, "nothing upcoming" isn't worth
 * an empty state of its own for something this secondary.
 *
 * Prompt 3 Phase 1 adds Tasks as the fourth real system:
 * `TodaysPrioritiesSection` renders up to 5 non-archived, not-yet-completed
 * tasks due today or overdue (`getTodaysPrioritiesForCurrentUser`,
 * `@/lib/life-planner/life-tasks`), which is why "Priorities" no longer
 * appears in `FutureModulesSection`'s own placeholder list below - the same
 * "don't promise a feature twice" reasoning Goals' own Prompt 2 Phase 2
 * removal already established.
 *
 * Prompt 3 Phase 2 adds Routines as the fifth real system:
 * `TodaysRoutinesSection` renders every active routine due today, each with
 * its own compact checklist and inline completion toggles
 * (`getTodaysRoutineItemsForCurrentUser`, `@/lib/life-planner/life-routines`)
 * - the same "don't promise a feature twice" reasoning removes
 * "Habits & Routines" from `FutureModulesSection`'s own placeholder list
 * below.
 *
 * Prompt 3 Phase 3 adds Habits alongside Routines, completing that same
 * "Habits & Routines" pairing: `TodaysHabitsSection` renders every active
 * habit with today's log toggle and its own streak/progress
 * (`getHabitsProgressForCurrentUser`, `@/lib/life-planner/life-habits`).
 * Both sections sit side by side under one shared "Today's habits &
 * routines" heading rather than each repeating "Today's" in its own title -
 * when neither has anything for today, a single calm combined empty state
 * replaces both cards rather than showing two separate "nothing here"
 * boxes next to each other.
 *
 * Prompt 4 Phase 1 adds Weekly & Monthly Planning as the sixth real system:
 * `WeeklyPlanningSection` renders up to 4 not-done priorities from the
 * current calendar week (`getCurrentWeekPrioritiesForCurrentUser`,
 * `@/lib/life-planner/life-planning`) plus a "Plan your week"/"Plan your
 * month" link pair into the full `/app/life-planner/planning/weekly`/
 * `/planning/monthly` views - which is why "Weekly & Monthly Planning" no
 * longer appears in `FutureModulesSection`'s own placeholder list below,
 * the same "don't promise a feature twice" reasoning every earlier real
 * system's own Prompt/Phase already established.
 *
 * Prompt 4 Phase 2 adds Journal as the seventh real system:
 * `RecentJournalSection` renders up to 3 recent, non-archived entries
 * (`getRecentJournalEntriesForCurrentUser`, `@/lib/life-planner/life-journal`)
 * plus a "Write a new entry" CTA - which is why "Journal & Important
 * Information" narrowed to just "Important Plans & Information" in
 * `FutureModulesSection`'s own placeholder list, the same "don't promise a
 * feature twice" reasoning every earlier real system's own Prompt/Phase
 * already established.
 *
 * Prompt 4 Phase 3 adds Important Plans & Information as the eighth and
 * final real system, which is why `FutureModulesSection` (and its own
 * `FutureModuleCard`) are gone entirely rather than rendering an empty grid
 * under an orphaned "What's coming next" heading - the same fate every
 * placeholder in that component's list already met one Phase at a time.
 * `RecentImportantItemsSection` renders up to 3 recent, non-archived items
 * (`getRecentImportantItemsForCurrentUser`,
 * `@/lib/life-planner/life-important-items`) plus a "New item" CTA, the
 * same "preview, not editor" role `RecentJournalSection` plays one section
 * up.
 *
 * Life Planner Prompt 5 Phase 2 is a hierarchy/polish pass over this same
 * page - no new systems, every one of the eight above stays exactly as
 * capable as Prompt 4 left it. Two changes:
 *
 * 1. Reordered around "what matters right now -> what am I working toward
 *    -> what should I focus on next", matching the top-level `/app`
 *    dashboard's own "recommended action above the grid" discipline
 *    (`NextActionBanner` before `PlannerGrid`). `TodaysPrioritiesSection`
 *    now leads the body (it's the one section that's actually urgent on
 *    any given day), followed by Goals/target dates, then Habits &
 *    Routines and Weekly Planning (the standing structure that produces
 *    those priorities), then Life Overview/Life Areas/Journal/Important
 *    Information as reference context - real and reachable, just no
 *    longer the first thing above the fold. This also happens to satisfy
 *    the mobile reading order Prompt 5 asks for: on a single-column
 *    layout, DOM order *is* mobile order, and current priorities -> goals
 *    -> standing tasks -> planning context -> secondary areas is exactly
 *    that order top to bottom.
 * 2. `LifeProfileSection` takes a `compact` prop (see that component) so a
 *    returning user with a filled-out profile sees a one-line summary
 *    strip instead of the full six-field read view on every visit -
 *    freeing space for the actionable sections above it without losing
 *    the profile itself, which stays one click away via "View full
 *    profile". Every dashboard-preview empty state (Goals, Priorities,
 *    Habits, Routines, Weekly Planning, Journal, Important Information)
 *    also dropped its decorative icon and shrank its padding - harmless
 *    alone, but a brand-new account sees several of these stacked with
 *    nothing between them, and the full `EmptyState` treatment (icon
 *    circle, py-10) reads as dead weight repeated five or six times in a
 *    row; the profile's own empty prompt is the one exception that keeps
 *    its icon, since it's still the single onboarding action worth extra
 *    visual weight. Recent Journal and Recent Important Information are
 *    now presented side by side under one shared "Journal & important
 *    information" label instead of stacked full-width - the same
 *    side-by-side pairing Habits & Routines already used, applied here so
 *    two secondary reference sections read as one lighter group instead
 *    of two more full-height cards.
 */
export default async function LifePlannerPage() {
  const plan = await requireLifePlanForCurrentUser();

  await ensureDefaultLifeAreas(plan.id);
  const [areas, goals, upcomingTargetDates, todaysPriorities, todaysRoutineGroups, habitsProgress, weeklyPriorities, recentJournalEntries, recentImportantItems] =
    await Promise.all([
      getLifeAreasForCurrentUser(),
      getLifeGoalsForCurrentUser(),
      getUpcomingTargetDatesForCurrentUser(),
      getTodaysPrioritiesForCurrentUser(),
      getTodaysRoutineItemsForCurrentUser(),
      getHabitsProgressForCurrentUser(),
      getCurrentWeekPrioritiesForCurrentUser(),
      getRecentJournalEntriesForCurrentUser(),
      getRecentImportantItemsForCurrentUser(),
    ]);
  const hasHabitsOrRoutinesToday = todaysRoutineGroups.length > 0 || habitsProgress.length > 0;

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:gap-10 md:py-14">
      <LifePlannerHeader plan={plan} />

      {/* What matters right now - the most urgent, actionable section leads
          the page (and, on a single-column layout, DOM order is mobile
          order too), the same "recommended action first" precedent the
          top-level `/app` dashboard's `NextActionBanner` sets ahead of its
          own grid. */}
      <div className="animate-hero-in" style={{ animationDelay: "80ms" }}>
        <TodaysPrioritiesSection tasks={todaysPriorities} />
      </div>

      {/* What you're working toward. */}
      <div className="animate-hero-in" style={{ animationDelay: "120ms" }}>
        <GoalsSection goals={goals} areas={areas} />
      </div>

      {upcomingTargetDates.length > 0 && (
        <div className="animate-hero-in" style={{ animationDelay: "140ms" }}>
          <UpcomingTargetDates items={upcomingTargetDates} />
        </div>
      )}

      {/* The standing structure behind those priorities and goals. */}
      <div className="flex flex-col gap-4 animate-hero-in" style={{ animationDelay: "160ms" }}>
        <Heading as="h2" size="h4">
          Today&rsquo;s habits &amp; routines
        </Heading>

        {hasHabitsOrRoutinesToday ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <TodaysHabitsSection habitsProgress={habitsProgress} today={todayIso()} />
            <TodaysRoutinesSection groups={todaysRoutineGroups} today={todayIso()} />
          </div>
        ) : (
          <Card variant="standard" padding="lg">
            <EmptyState
              title="Nothing scheduled today"
              description="Habits and routines due today will show up here."
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button href="/app/life-planner/habits/new" size="sm" variant="outline">
                    Add a habit
                  </Button>
                  <Button href="/app/life-planner/routines/new" size="sm" variant="outline">
                    Add a routine
                  </Button>
                </div>
              }
              className="py-6"
            />
          </Card>
        )}
      </div>

      <div className="animate-hero-in" style={{ animationDelay: "200ms" }}>
        <WeeklyPlanningSection priorities={weeklyPriorities} />
      </div>

      {/* Reference context from here down: real, reachable, and no longer
          competing with the actionable sections above for first attention.
          `compact` collapses Life Overview to a one-line summary once it's
          been filled out at least once - see that component's own comment. */}
      <div className="flex flex-col gap-4 animate-hero-in" style={{ animationDelay: "220ms" }}>
        <Heading as="h2" size="h4">
          Life Overview
        </Heading>
        <LifeProfileSection plan={plan} compact />
      </div>

      <div className="animate-hero-in" style={{ animationDelay: "240ms" }}>
        <LifeAreasPreview areas={areas} />
      </div>

      <div className="flex flex-col gap-3 animate-hero-in" style={{ animationDelay: "260ms" }}>
        <Heading as="h2" size="h4" className="text-body-lg">
          Journal &amp; important information
        </Heading>
        <div className="grid gap-4 lg:grid-cols-2">
          <RecentJournalSection entries={recentJournalEntries} />
          <RecentImportantItemsSection items={recentImportantItems} />
        </div>
      </div>
    </Container>
  );
}

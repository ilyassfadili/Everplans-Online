import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { getAllCategoriesForPlan } from "@/lib/budget/categories";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";
import { getRecurringItemsForPlan } from "@/lib/budget/recurring";
import { getUpcomingOccurrences, UPCOMING_WINDOW_DAYS } from "@/lib/budget/recurring-occurrence";

import { PageHeader } from "../../_components/page-header";
import { RecurringList } from "./_components/recurring-list";
import { UpcomingTimeline } from "./_components/upcoming-timeline";

export const metadata: Metadata = {
  title: "Recurring",
  robots: { index: false, follow: false },
};

/**
 * The Budget Planner's Recurring page - the recurring-item management list
 * (Prompt 4 Phase 1) first, then the Upcoming Money Timeline (Phase 2)
 * below it, since the timeline is only ever a read of those same items.
 * For a brand-new plan with nothing recurring yet, that order matters:
 * leading with "Upcoming" would show its own "nothing expected" empty
 * state before the user has even seen the actual action ("add a recurring
 * item") that makes it meaningful - two stacked "there's nothing here"
 * messages read as broken, not helpful. `UpcomingTimeline` itself also
 * renders nothing at all until at least one recurring item exists, so the
 * list's own empty state is the only "nothing yet" message a new visitor
 * sees.
 */
export default async function RecurringPage() {
  const plan = await requireBudgetPlanForCurrentUser();

  // `getAllCategoriesForPlan` (not just active) so a recurring item already
  // pointed at an archived category still displays its real name here -
  // same "archiving must not orphan existing references" fix the Expenses
  // page applies.
  const [recurringItems, categories] = await Promise.all([getRecurringItemsForPlan(plan.id), getAllCategoriesForPlan(plan.id, "expense")]);
  const occurrences = getUpcomingOccurrences(recurringItems, UPCOMING_WINDOW_DAYS);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Recurring" description="Income, bills, and savings contributions that happen on a schedule." />
      <RecurringList planId={plan.id} recurringItems={recurringItems} categories={categories} currency={plan.currency} />
      {recurringItems.length > 0 && <UpcomingTimeline occurrences={occurrences} categories={categories} currency={plan.currency} />}
    </Container>
  );
}

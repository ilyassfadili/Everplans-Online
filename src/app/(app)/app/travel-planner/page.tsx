import type { Metadata } from "next";

import { Container, Reveal } from "@/components/ui";
import { getBookingsForTrip } from "@/lib/travel/bookings";
import { calculateBudgetSummary } from "@/lib/travel/budget";
import { getBudgetCategoriesForTrip } from "@/lib/travel/budget-categories";
import { getDocumentsForTrip } from "@/lib/travel/documents";
import { getExpensesForTrip } from "@/lib/travel/expenses";
import { getPackingItemsForTrip } from "@/lib/travel/packing";
import { calculatePackingProgress, calculateTripSetupProgress } from "@/lib/travel/progress";
import { requireTripForCurrentUser } from "@/lib/travel/trips";

import { BudgetSummaryCard } from "./_components/budget-summary-card";
import { DocumentsSummaryCard } from "./_components/documents-summary-card";
import { PackingSummaryCard } from "./_components/packing-summary-card";
import { SetupProgressCard } from "./_components/setup-progress-card";
import { TravelHeader } from "./_components/travel-header";
import { TripCountdownCard } from "./_components/trip-countdown-card";
import { TripDetailsCard } from "./_components/trip-details-card";
import { TripGoalsNotesCard } from "./_components/trip-goals-notes-card";
import { UpcomingBookingsCard } from "./_components/upcoming-bookings-card";

export const metadata: Metadata = {
  title: "Travel Planner",
  robots: { index: false, follow: false },
};

/**
 * The Travel Planner dashboard - grown one real module at a time (Prompt 1
 * Phase 4's trip overview, Prompt 3 Phase 4's budget/bookings summaries,
 * Prompt 4 Phase 4's packing/documents summaries, now gated by real
 * commerce as of Prompt 6). `requireTripForCurrentUser()` (`@/lib/travel/trips`)
 * is the real gate: no entitlement sends the visitor to checkout, an
 * entitlement with no trip yet sends them to trip setup, so this page only
 * ever renders for a trip that genuinely exists.
 *
 * Every card here reads real, persisted trip data, through the exact same
 * functions each feature's own page uses (`calculateBudgetSummary`,
 * `getBookingsForTrip`, `calculatePackingProgress`) - never a second,
 * dashboard-only calculation that could drift from what each feature's own
 * page shows ("no duplicated source of truth"). Itinerary and Travel
 * Information don't have their own dashboard card - Itinerary has no
 * single "here's where things stand" number worth summarizing (it's
 * already one click away via "View itinerary" in the header), and Travel
 * Information is itself a summary of data already shown elsewhere
 * (bookings, trip notes) - a third summary of a summary would be noise,
 * not signal.
 */
export default async function TravelPlannerPage() {
  const trip = await requireTripForCurrentUser();

  const [categories, expenses, bookings, packingItems, documents] = await Promise.all([
    getBudgetCategoriesForTrip(trip.id),
    getExpensesForTrip(trip.id),
    getBookingsForTrip(trip.id),
    getPackingItemsForTrip(trip.id),
    getDocumentsForTrip(trip.id),
  ]);

  const progress = calculateTripSetupProgress(trip);
  const budgetSummary = calculateBudgetSummary(trip.totalBudgetCents, categories, expenses);
  const packingProgress = calculatePackingProgress(packingItems);

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:gap-8 md:py-14">
      <TravelHeader trip={trip} />

      {/* Above-the-fold row: the plain CSS `animate-hero-in` keyframe (not
          `Reveal`, whose IntersectionObserver would flash content that's
          already in view on mount - see `WeddingPlannerPage`'s own
          comment for the same reasoning). No `items-start` so CSS Grid's
          default `stretch` keeps both cards in the row the same height. */}
      <div className="grid animate-hero-in gap-6 lg:grid-cols-2" style={{ animationDelay: "80ms" }}>
        <TripCountdownCard startDate={trip.startDate} endDate={trip.endDate} />
        <SetupProgressCard progress={progress} hasGoals={Boolean(trip.tripGoals)} hasNotes={Boolean(trip.notes)} />
      </div>

      <Reveal className="grid gap-6 lg:grid-cols-2">
        <BudgetSummaryCard summary={budgetSummary} currency={trip.currency} />
        <UpcomingBookingsCard bookings={bookings} />
      </Reveal>

      <Reveal delay={70} className="grid gap-6 lg:grid-cols-2">
        <PackingSummaryCard progress={packingProgress} />
        <DocumentsSummaryCard documents={documents} />
      </Reveal>

      <Reveal delay={140} className="grid gap-6 lg:grid-cols-2">
        <TripDetailsCard trip={trip} />
        <TripGoalsNotesCard tripGoals={trip.tripGoals} notes={trip.notes} />
      </Reveal>
    </Container>
  );
}

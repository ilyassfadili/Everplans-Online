import type { Metadata } from "next";
import { Container, Heading, Reveal } from "@/components/ui";
import { calculateBudgetSummary, calculateCategorySummaries, calculateIncomeSummary, calculateTotalPlannedSavingsCents } from "@/lib/budget/budget";
import { getCategoriesForPlan } from "@/lib/budget/categories";
import { getExpensesForPlan } from "@/lib/budget/expenses";
import { getGoalsForPlan } from "@/lib/budget/goals";
import { getBudgetInsights } from "@/lib/budget/insights";
import { getIncomeSourcesForPlan } from "@/lib/budget/income-sources";
import { parseMonthParam } from "@/lib/budget/month";
import { getMonthlyOverview } from "@/lib/budget/overview";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";
import { getRecurringItemsForPlan } from "@/lib/budget/recurring";
import { getSavingsTargetsForPlan } from "@/lib/budget/savings-targets";

import { AttentionPanel } from "./_components/attention-panel";
import { BudgetHeader } from "./_components/budget-header";
import { CategoriesPanel } from "./_components/categories-panel";
import { CategorySpendingList } from "./_components/category-spending-list";
import { ExpensesPanel } from "./_components/expenses-panel";
import { GoalsPanel } from "./_components/goals-panel";
import { IncomePanel } from "./_components/income-panel";
import { InsightsPanel } from "./_components/insights-panel";
import { MoneyOverviewCards } from "./_components/money-overview-cards";
import { MoneyOverviewEmptyState } from "./_components/money-overview-empty-state";
import { MonthSwitcher } from "./_components/month-switcher";
import { RecentActivityList } from "./_components/recent-activity-list";
import { StatusSummary } from "./_components/status-summary";
import { TrendsPanel } from "./_components/trends-panel";

export const metadata: Metadata = {
  title: "Budget Planner",
  robots: { index: false, follow: false },
};

/**
 * The Budget Planner's dashboard - the workspace home from Prompt 1 Phase 4.
 * `getBudgetPlanForCurrentUser()` gates the route (it calls `requireUser()`
 * internally): no plan yet sends the visitor to onboarding.
 *
 * Everplans Money Prompt 1 Phase 3 / Prompt 3 adds a month-aware Money
 * Overview above everything else - real income/expenses/net, spending by
 * category, and recent activity for exactly one calendar month
 * (`?month=`, via `@/lib/budget/month`'s `MonthKey`), read fresh from
 * `getMonthlyOverview` each request. It's additive: every panel below it
 * keeps reading the plan's own unscoped, current-state totals exactly as
 * it always has.
 *
 * Every number here is derived fresh from the plan's current income,
 * categories, expenses, goals, and recurring items at request time - never
 * stored, so it can never drift from what each dedicated page itself shows.
 * `InsightsPanel` (Prompt 4 Phase 3) and `AttentionPanel` (Prompt 2 Phase 1)
 * are deliberately different lenses over the same data - Attention is
 * "needs a look" (over-budget/unallocated), Insights is broader (goal
 * momentum, recurring activity) - never a duplicated message between them.
 *
 * Hierarchy: the selected month's Overview first (it's now the true top of
 * the page), then overall status, then money available (income) and
 * spending (budget), then recent activity and goals, then insights and
 * attention, then trends last - each step less urgent than the one before
 * it, so the calmest information sits at the bottom.
 */
export default async function BudgetPlannerPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const plan = await requireBudgetPlanForCurrentUser();

  const { month: monthParam } = await searchParams;
  const month = parseMonthParam(monthParam);

  const [incomeSources, categories, expenses, goals, savingsTargets, recurringItems, overview] = await Promise.all([
    getIncomeSourcesForPlan(plan.id),
    getCategoriesForPlan(plan.id),
    getExpensesForPlan(plan.id),
    getGoalsForPlan(plan.id),
    getSavingsTargetsForPlan(plan.id),
    getRecurringItemsForPlan(plan.id),
    getMonthlyOverview(plan.id, month),
  ]);

  const incomeSummary = calculateIncomeSummary(incomeSources, plan.periodType);
  const budgetSummary = calculateBudgetSummary(incomeSources, categories, expenses, plan.periodType);
  const categorySummaries = calculateCategorySummaries(categories, expenses);
  const totalPlannedSavingsCents = calculateTotalPlannedSavingsCents(savingsTargets, plan.periodType);
  const insights = getBudgetInsights({
    goals,
    recurringItems,
    currency: plan.currency,
    periodType: plan.periodType,
    totalPlannedCents: budgetSummary.totalPlannedCents,
  });

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:gap-8 md:py-14">
      {/* Above-the-fold: this is now the true top of the page, so it gets
          the same plain CSS `animate-hero-in` treatment `BudgetHeader` and
          `StatusSummary` already use, rather than `Reveal`'s
          IntersectionObserver (which is for below-the-fold content only). */}
      <div className="flex flex-col gap-6 animate-hero-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading as="h2" size="h3">
            Overview
          </Heading>
          <MonthSwitcher month={month} basePath="/app/budget-planner" />
        </div>

        {overview.transactionCount === 0 ? (
          <MoneyOverviewEmptyState month={month} />
        ) : (
          <>
            <MoneyOverviewCards overview={overview} currency={plan.currency} />
            <div className="grid gap-6 lg:grid-cols-2">
              <CategorySpendingList categoryBreakdown={overview.categoryBreakdown} currency={plan.currency} />
              <RecentActivityList transactions={overview.recentTransactions} currency={plan.currency} />
            </div>
          </>
        )}
      </div>

      <BudgetHeader plan={plan} />

      {/* Above-the-fold: plain CSS `animate-hero-in`, same reasoning
          `WeddingPlannerPage` documents - content that starts visible on
          load shouldn't also run through `Reveal`'s IntersectionObserver. */}
      <div className="animate-hero-in" style={{ animationDelay: "80ms" }}>
        <StatusSummary
          summary={budgetSummary}
          currency={plan.currency}
          hasAnyIncome={incomeSources.length > 0}
          hasAnyCategories={categories.length > 0}
        />
      </div>

      <Reveal className="grid gap-6 lg:grid-cols-2">
        <IncomePanel summary={incomeSummary} currency={plan.currency} periodType={plan.periodType} />
        <CategoriesPanel categorySummaries={categorySummaries} currency={plan.currency} />
      </Reveal>

      <Reveal delay={70} className="grid gap-6 lg:grid-cols-2">
        <ExpensesPanel recentExpenses={expenses} currency={plan.currency} />
        <GoalsPanel goals={goals} currency={plan.currency} plannedSavingsCents={totalPlannedSavingsCents} periodType={plan.periodType} />
      </Reveal>

      <Reveal delay={140} className="flex flex-col gap-6">
        <InsightsPanel insights={insights} />
        <AttentionPanel summary={budgetSummary} categorySummaries={categorySummaries} currency={plan.currency} />
      </Reveal>

      <Reveal delay={200}>
        <TrendsPanel />
      </Reveal>
    </Container>
  );
}

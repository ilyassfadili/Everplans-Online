import { convertToPeriodCents } from "@/lib/budget/period";
import { getUpcomingOccurrencesForItem } from "@/lib/budget/recurring-occurrence";
import { getGoalProgressStatus } from "@/lib/budget/goal-progress";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetGoal, BudgetPeriodType, BudgetRecurringItem } from "@/types/budget";

/**
 * Budget Insights (Prompt 4 Phase 3) - pure derivations over already-fetched
 * goals/recurring items, no database access. Every insight is computed
 * fresh from current data on every read, so nothing here can go stale: the
 * moment the underlying condition stops being true, the insight simply
 * stops being generated, rather than lingering as a stored row someone has
 * to dismiss. Deliberately narrow in scope - this complements
 * `AttentionPanel` (Prompt 2 Phase 1's "needs a look" surface for
 * over-budget/unallocated categories) rather than repeating it: insights
 * here are about recurring activity and goal momentum, the two areas
 * `AttentionPanel` doesn't cover.
 */

export type InsightPriority = "important" | "useful" | "optional";

export interface BudgetInsight {
  id: string;
  priority: InsightPriority;
  message: string;
  actionLabel: string;
  actionHref: string;
}

const PRIORITY_RANK: Record<InsightPriority, number> = { important: 0, useful: 1, optional: 2 };

/** A single recurring expense/savings item counting for at least this share of total planned spending is worth flagging - not a problem, just a "here's where a lot of your plan goes." */
const SIGNIFICANT_SHARE_THRESHOLD = 0.25;
const DUE_SOON_DAYS = 3;

function formatOccurrenceDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface InsightContext {
  goals: BudgetGoal[];
  recurringItems: BudgetRecurringItem[];
  currency: string;
  periodType: BudgetPeriodType;
  totalPlannedCents: number;
}

export function getBudgetInsights({ goals, recurringItems, currency, periodType, totalPlannedCents }: InsightContext): BudgetInsight[] {
  const insights: BudgetInsight[] = [];

  // Goal momentum - only the encouraging/actionable states, never a
  // judgment on "not-started" or "behind-plan" (those already read clearly
  // as a status badge on the Goals page itself).
  for (const goal of goals) {
    const status = getGoalProgressStatus(goal);
    if (status === "near-target") {
      const remaining = goal.targetAmountCents - goal.currentAmountCents;
      insights.push({
        id: `goal-near-${goal.id}`,
        priority: "useful",
        message: `You're close on "${goal.name}" - just ${formatCurrency(remaining, currency)} to go.`,
        actionLabel: "View goal",
        actionHref: "/app/budget-planner/goals",
      });
    } else if (status === "completed") {
      insights.push({
        id: `goal-complete-${goal.id}`,
        priority: "useful",
        message: `"${goal.name}" is fully funded. Nice work.`,
        actionLabel: "View goals",
        actionHref: "/app/budget-planner/goals",
      });
    }
  }

  // Recurring activity - due-soon heads-up and "this one item is a big
  // share of the plan," both genuinely new information the Recurring page
  // itself doesn't lead with at a glance.
  for (const item of recurringItems) {
    if (!item.isActive) continue;

    const upcoming = getUpcomingOccurrencesForItem(item, DUE_SOON_DAYS)[0];
    if (upcoming && item.type !== "income") {
      insights.push({
        id: `due-soon-${item.id}`,
        priority: "useful",
        message: `${item.name} is due ${formatOccurrenceDate(upcoming.date)} (${formatCurrency(item.amountCents, currency)}).`,
        actionLabel: "View recurring",
        actionHref: "/app/budget-planner/recurring",
      });
    }

    if (item.type !== "income" && totalPlannedCents > 0) {
      const perPeriodCents = convertToPeriodCents(item.amountCents, item.frequency, periodType);
      if (perPeriodCents / totalPlannedCents >= SIGNIFICANT_SHARE_THRESHOLD) {
        insights.push({
          id: `significant-${item.id}`,
          priority: "optional",
          message: `${item.name} makes up a significant part of your planned spending.`,
          actionLabel: "View recurring",
          actionHref: "/app/budget-planner/recurring",
        });
      }
    }
  }

  return insights.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

import { getPeriodDurationDays } from "@/lib/budget/period";
import type { BudgetGoal, BudgetPeriodType, GoalProgressStatus } from "@/types/budget";

/** A goal is "near target" once it crosses this share of its target amount, short of actually being there. */
const NEAR_TARGET_THRESHOLD = 0.9;

function isPastTargetDate(targetDate: string | null): boolean {
  if (!targetDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${targetDate}T00:00:00`) < today;
}

/**
 * Pure derivation, no database access - see `GoalProgressStatus`'s own
 * comment for why this is always computed fresh rather than trusting the
 * stored `status` column. `completed` wins over every other state
 * regardless of date; `behind-plan` only applies to a goal that's neither
 * completed nor brand new, so a goal with $0 saved past its target date
 * reads as "not started" (an honest starting point) rather than "behind
 * plan" (which would read as a judgment on a goal never actually begun).
 */
export function getGoalProgressStatus(goal: BudgetGoal): GoalProgressStatus {
  const percent = goal.targetAmountCents > 0 ? goal.currentAmountCents / goal.targetAmountCents : goal.currentAmountCents > 0 ? 1 : 0;

  if (percent >= 1) return "completed";
  if (percent <= 0) return "not-started";
  if (isPastTargetDate(goal.targetDate)) return "behind-plan";
  if (percent >= NEAR_TARGET_THRESHOLD) return "near-target";
  return "in-progress";
}

/**
 * "Target amount → current progress → time remaining → suggested
 * contribution" (Prompt 3 Phase 4) - `null` whenever the calculation
 * wouldn't be reliable: no target date set, the date has already passed, or
 * the goal is already met. Never speculative financial advice, just the
 * plan's own numbers divided by the plan's own periods.
 */
export function calculateSuggestedContributionCents(goal: BudgetGoal, periodType: BudgetPeriodType): number | null {
  if (!goal.targetDate) return null;

  const remainingCents = goal.targetAmountCents - goal.currentAmountCents;
  if (remainingCents <= 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(`${goal.targetDate}T00:00:00`);
  const daysRemaining = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (daysRemaining <= 0) return null;

  const periodsRemaining = Math.max(1, daysRemaining / getPeriodDurationDays(periodType));
  return Math.ceil(remainingCents / periodsRemaining);
}

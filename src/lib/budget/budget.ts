import { convertToPeriodCents } from "@/lib/budget/period";
import type {
  BudgetCategory,
  BudgetCategorySummary,
  BudgetExpense,
  BudgetIncomeSource,
  BudgetIncomeSummary,
  BudgetPeriodType,
  BudgetSavingsTarget,
  BudgetStatus,
  BudgetSummary,
  CategorySpendingStatus,
} from "@/types/budget";

/** A category is "approaching limit" once actual spending crosses this share of what was planned - short of over budget, but close enough to be worth a heads-up. */
const APPROACHING_LIMIT_THRESHOLD = 0.8;

/**
 * Pure derivations over already-fetched income/categories/expenses - no
 * database access. Nothing here is ever stored (same "single source of
 * truth" principle `@/lib/wedding/budget` follows) - the dashboard, the
 * budget page, and any future insights all call through these same
 * functions, so they can never disagree about what "expected income" or
 * "remaining budget" means.
 */

/** Active income sources' total, converted to the plan's current period - inactive sources are excluded entirely, not just zeroed. */
export function calculateIncomeSummary(incomeSources: BudgetIncomeSource[], periodType: BudgetPeriodType): BudgetIncomeSummary {
  const active = incomeSources.filter((source) => source.isActive);

  return {
    totalExpectedCents: active.reduce((sum, source) => sum + convertToPeriodCents(source.amountCents, source.frequency, periodType), 0),
    activeSourceCount: active.length,
  };
}

function deriveBudgetStatus(expectedIncomeCents: number, totalPlannedCents: number): BudgetStatus {
  if (totalPlannedCents > expectedIncomeCents) return "over-allocated";

  // "Needs attention" means a meaningful share of income is still
  // unallocated - not simply "not literally 100% planned," which would flag
  // every brand-new budget as a problem the moment a single category exists.
  const unallocatedCents = expectedIncomeCents - totalPlannedCents;
  const unallocatedShare = expectedIncomeCents > 0 ? unallocatedCents / expectedIncomeCents : 0;
  if (expectedIncomeCents > 0 && unallocatedShare > 0.25) return "needs-attention";

  return "healthy";
}

export function calculateBudgetSummary(
  incomeSources: BudgetIncomeSource[],
  categories: BudgetCategory[],
  expenses: BudgetExpense[],
  periodType: BudgetPeriodType,
): BudgetSummary {
  const { totalExpectedCents } = calculateIncomeSummary(incomeSources, periodType);
  const totalPlannedCents = categories.reduce((sum, category) => sum + category.plannedAmountCents, 0);
  const totalActualCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return {
    expectedIncomeCents: totalExpectedCents,
    totalPlannedCents,
    totalActualCents,
    unallocatedCents: totalExpectedCents - totalPlannedCents,
    remainingCents: totalExpectedCents - totalActualCents,
    status: deriveBudgetStatus(totalExpectedCents, totalPlannedCents),
  };
}

/** Per-category planned/actual/remaining, plus the expenses that landed in each - `isOverBudget` is `actual > planned`, calculated fresh each time. */
export function calculateCategorySummaries(categories: BudgetCategory[], expenses: BudgetExpense[]): BudgetCategorySummary[] {
  return categories.map((category) => {
    const categoryExpenses = expenses.filter((expense) => expense.categoryId === category.id);
    const actualCents = categoryExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

    return {
      category,
      actualCents,
      remainingCents: category.plannedAmountCents - actualCents,
      isOverBudget: actualCents > category.plannedAmountCents,
      expenses: categoryExpenses,
    };
  });
}

/** Expenses with no category at all - "Uncategorized" isn't a real category row, just what's left after grouping by the real ones. */
export function getUncategorizedExpenses(expenses: BudgetExpense[]): BudgetExpense[] {
  return expenses.filter((expense) => !expense.categoryId);
}

/**
 * Budget vs. Actual's three-state read for one category (Prompt 3 Phase 2).
 * Neutral language throughout ("approaching limit," never "danger" or
 * "warning: overspending") - the product never implies the user did
 * something wrong.
 */
export function getCategorySpendingStatus(summary: BudgetCategorySummary): CategorySpendingStatus {
  if (summary.category.plannedAmountCents <= 0) return "on-track";
  if (summary.isOverBudget) return "over-budget";
  if (summary.actualCents / summary.category.plannedAmountCents >= APPROACHING_LIMIT_THRESHOLD) return "approaching-limit";
  return "on-track";
}

/** Active savings targets' total, converted to the plan's current period - same "active only, converted once, in one place" shape `calculateIncomeSummary` uses. Deliberately not folded into `BudgetSummary` - see `@/lib/budget/savings-targets`'s own comment on why savings targets stay outside the planned-spending math. */
export function calculateTotalPlannedSavingsCents(savingsTargets: BudgetSavingsTarget[], periodType: BudgetPeriodType): number {
  return savingsTargets
    .filter((target) => target.isActive)
    .reduce((sum, target) => sum + convertToPeriodCents(target.plannedAmountCents, target.frequency, periodType), 0);
}

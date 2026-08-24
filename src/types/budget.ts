/**
 * The Budget Planner's own domain model - `public.budget_plans` and its
 * children (see `supabase/migrations/20260901000000_budget_planner_foundation.sql`).
 * One root per account (`BudgetPlan.ownerId`, enforced by a `unique
 * (owner_id)` constraint and RLS, the exact same shape `@/types/wedding`'s
 * `Wedding` uses), everything else scoped to it via `planId`.
 *
 * Deliberately unrelated to the generic planner marketplace's
 * `PlannerDefinition`/`PlannerInstance` types - this is a real, purpose-built
 * product with its own relational shape (income sources, categories, goals,
 * recurring items), not an instance of the generic field-answer wizard. See
 * `@/types/wedding`'s own comment for the full reasoning, which applies here
 * unchanged.
 */

/** How often a plan's "current period" is calculated - Prompt 2 Phase 2's income-to-period conversion reads this to decide what "expected income" means for this plan. */
export type BudgetPeriodType = "weekly" | "biweekly" | "monthly" | "yearly";

export interface BudgetPlan {
  id: string;
  ownerId: string;
  name: string;
  /** ISO 4217 currency code, e.g. "USD" - the one workspace-level currency every amount in this plan is formatted in, same convention as `Wedding.currency`. */
  currency: string;
  periodType: BudgetPeriodType;
  createdAt: string;
  updatedAt: string;
}

/** Every frequency used anywhere in the Budget Planner - the union of `BudgetIncomeFrequency` and `budget_recurring_items_frequency_valid`'s own set. Prefer the narrower, table-specific type where one applies; this exists for code that genuinely spans both (e.g. `@/lib/budget/period`'s conversion math). */
export type BudgetFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "one-time";

/** Matches `budget_income_sources_frequency_valid` exactly - income has no `"quarterly"` option, but does allow `"one-time"`. */
export type BudgetIncomeFrequency = Exclude<BudgetFrequency, "quarterly">;

/** Matches `budget_recurring_items_frequency_valid` / `budget_savings_targets_frequency_valid` exactly - both allow `"quarterly"` but neither allows `"one-time"` (a recurring thing or a recurring savings plan, by definition, isn't one-time). */
export type BudgetRecurringFrequency = Exclude<BudgetFrequency, "one-time">;

/** `public.budget_income_sources`. Not a fixed set of types - `name` is free text ("Salary," "Freelance," "Allowance," anything a user types). */
export interface BudgetIncomeSource {
  id: string;
  planId: string;
  name: string;
  amountCents: number;
  frequency: BudgetIncomeFrequency;
  isActive: boolean;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A small, closed set of broad groupings a category can belong to (Prompt 5 Phase 1 builds real organization around this) - not a rigid budgeting methodology, just enough structure to group "essentials" apart from "lifestyle" when a user wants to. */
export type BudgetCategoryGroup = "essentials" | "lifestyle" | "savings" | "goals" | "other";

/** Which side of the ledger a category applies to (Everplans Money Prompt 2's "categories must distinguish income vs. expense"). Every category that existed before this field was added is `"expense"` - the only kind anything actually referenced. */
export type BudgetCategoryKind = "income" | "expense";

/** `public.budget_categories` - the planning side ("what do I expect to spend"). Monetary amounts are integer minor units (cents), never floating point. */
export interface BudgetCategory {
  id: string;
  planId: string;
  name: string;
  group: BudgetCategoryGroup;
  kind: BudgetCategoryKind;
  plannedAmountCents: number;
  /** `true` once archived (Prompt 5 Phase 1) - archived categories are hidden from active views but never deleted, so existing expenses/recurring items that reference one keep working. */
  isArchived: boolean;
  sortOrder: number;
  /** Optional context (Prompt 5 Phase 2) - why this category is shaped the way it is, e.g. "cut this back after the trip." */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A financial account (Everplans Money Prompt 1's "Accounts foundation") - manual organization only, never a bank integration or synced balance. `name` is free text ("Chase Checking," "Emergency Fund"). */
export type BudgetAccountType = "checking" | "savings" | "cash" | "credit-card" | "other";

/** `public.budget_accounts`. */
export interface BudgetAccount {
  id: string;
  planId: string;
  name: string;
  type: BudgetAccountType;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BudgetGoalStatus = "not-started" | "in-progress" | "completed";

/**
 * A goal's displayed progress state (Prompt 3 Phase 3) - always derived from
 * its current/target amounts and target date at read time
 * (`@/lib/budget/goal-progress`), never the stored `BudgetGoalStatus`
 * column: a manually-set status can go stale the moment a contribution is
 * logged, this can't. `"behind-plan"` is informative, not punitive - it
 * only means the target date has passed without the goal being reached.
 */
export type GoalProgressStatus = "not-started" | "in-progress" | "near-target" | "completed" | "behind-plan";

/** `public.budget_goals` - independent of any one category; a goal is money set aside toward something, not spending. */
export interface BudgetGoal {
  id: string;
  planId: string;
  name: string;
  targetAmountCents: number;
  currentAmountCents: number;
  /** `null` means no target date was set - never a forced placeholder. */
  targetDate: string | null;
  description: string | null;
  status: BudgetGoalStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** An actual expense - `public.budget_expenses`. `categoryId` is an optional reference, never a duplicated category name. */
export interface BudgetExpense {
  id: string;
  planId: string;
  categoryId: string | null;
  /** `null` for a one-off expense; set when this row was generated from a recurring definition (Prompt 4). */
  recurringItemId: string | null;
  /** Optional reference to the account this was paid from (Everplans Money Prompt 1's "Accounts foundation") - `null` means not tracked. */
  accountId: string | null;
  title: string;
  amountCents: number;
  expenseDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Actual income received - `public.budget_income_entries`, the income-side
 * counterpart to `BudgetExpense` (Everplans Money Prompt 2's "income needs
 * amount, source, date... " requirement, which `BudgetIncomeSource` - a
 * recurring *definition*, never a dated event - can't represent on its
 * own). `sourceId` optionally links back to the recurring income source this
 * payment came from; `null` means a one-off/untracked-source payment.
 */
export interface BudgetIncomeEntry {
  id: string;
  planId: string;
  sourceId: string | null;
  categoryId: string | null;
  accountId: string | null;
  title: string;
  amountCents: number;
  entryDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What kind of financial activity a recurring item represents - income, an expense/bill/subscription, or a planned savings contribution. */
export type BudgetRecurringItemType = "income" | "expense" | "savings";

/**
 * `public.budget_recurring_items` - a *definition* of something that
 * repeats, deliberately separate from any actual occurrence (Prompt 4
 * Phase 1: "recurring definitions must not incorrectly become completed
 * transactions"). `categoryId` only makes sense for `type: "expense"`;
 * left `null` otherwise.
 */
export interface BudgetRecurringItem {
  id: string;
  planId: string;
  type: BudgetRecurringItemType;
  name: string;
  amountCents: number;
  categoryId: string | null;
  /** Optional reference to the account this affects (Everplans Money Prompt 1's "Accounts foundation") - `null` means not tracked. */
  accountId: string | null;
  frequency: BudgetRecurringFrequency;
  startDate: string;
  /** `null` means it repeats indefinitely. */
  endDate: string | null;
  /** The next date this item is expected to occur - calculated and kept current by `@/lib/budget/recurring.ts`, never hand-edited. */
  nextOccurrenceDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `public.budget_savings_targets` - a planned, recurring contribution
 * toward a goal (or general savings when `goalId` is `null`). Separate from
 * `BudgetGoal` ("what") and `BudgetRecurringItem` ("how much, how often, and
 * optionally toward what") - Prompt 3 Phase 4 builds the real experience on
 * top of this shape.
 */
export interface BudgetSavingsTarget {
  id: string;
  planId: string;
  goalId: string | null;
  name: string;
  plannedAmountCents: number;
  frequency: BudgetRecurringFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Overall budget health, derived - never stored (same "single source of
 * truth" principle `WeddingBudgetSummary` follows). `status` is a plain-
 * language read of the same numbers everything else here already shows,
 * not a second, independently-computed judgment.
 */
export type BudgetStatus = "healthy" | "needs-attention" | "over-allocated";

export interface BudgetSummary {
  /** Expected income for the plan's current period, converted via `@/lib/budget/period.ts`. */
  expectedIncomeCents: number;
  totalPlannedCents: number;
  totalActualCents: number;
  /** `expectedIncomeCents - totalPlannedCents` - what's left to allocate, which can be negative. */
  unallocatedCents: number;
  /** `expectedIncomeCents - totalActualCents` - what's left to spend, which can be negative. */
  remainingCents: number;
  status: BudgetStatus;
}

/** One category's own planned/actual/remaining breakdown, plus whichever expenses landed in it - same shape as `WeddingBudgetCategorySummary`. */
export interface BudgetCategorySummary {
  category: BudgetCategory;
  actualCents: number;
  remainingCents: number;
  isOverBudget: boolean;
  expenses: BudgetExpense[];
}

/**
 * Budget vs. Actual's own per-category read (Prompt 3 Phase 2) - "on
 * track," "approaching limit," or "over budget," derived from the same
 * `BudgetCategorySummary` every other view reads, never a second stored
 * judgment. A category with nothing planned yet is always `"on-track"` -
 * there's no limit to approach or exceed.
 */
export type CategorySpendingStatus = "on-track" | "approaching-limit" | "over-budget";

/** Derived income totals for the plan's current period - never stored. */
export interface BudgetIncomeSummary {
  totalExpectedCents: number;
  activeSourceCount: number;
}

/**
 * A single row on the unified Transactions view (Everplans Money Prompt 2) -
 * the common shape `BudgetExpense` and `BudgetIncomeEntry` normalize into so
 * one list/search/filter/sort can operate over both without the UI needing
 * to know which table a given row actually came from. Always derived at
 * read time (`@/lib/budget/transactions.ts`) - never its own stored row.
 */
export interface BudgetTransaction {
  id: string;
  type: "income" | "expense";
  title: string;
  amountCents: number;
  date: string;
  categoryId: string | null;
  accountId: string | null;
  note: string | null;
}

/** One category's actual spend within a specific month - the Overview's spending-by-category read (Everplans Money Prompt 1/3). Expense categories only; income has no comparable "spend" concept. */
export interface MonthlyCategoryBreakdown {
  category: BudgetCategory;
  actualCents: number;
}

/**
 * The Money Overview's month-scoped read (Everplans Money Prompt 1 Phase 3)
 * - real income/expense/net for exactly one calendar month
 * (`@/lib/budget/month.ts`'s `MonthKey`), computed from `budget_income_entries`
 * and `budget_expenses` rows dated within it. Deliberately distinct from
 * `BudgetSummary` (the plan's own "expected income vs. planned vs. actual"
 * read, unscoped to any one month) - this is "what actually happened in
 * August," that is "how is the ongoing budget tracking right now."
 */
export interface MonthlyOverview {
  month: string;
  totalIncomeCents: number;
  totalExpenseCents: number;
  netCents: number;
  categoryBreakdown: MonthlyCategoryBreakdown[];
  recentTransactions: BudgetTransaction[];
  transactionCount: number;
}

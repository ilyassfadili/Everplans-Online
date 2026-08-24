/**
 * The Life Planner's own workspace identity - `public.life_plans` (see
 * `supabase/migrations/20260911000000_life_planner_foundation.sql`). One
 * row per account: `ownerId` always equals the creating user's
 * `auth.users.id`, enforced both by the table's `unique (owner_id)`
 * constraint and by RLS - the same shape `Trip` (`@/types/travel`) already
 * establishes for a hand-built, purpose-built product.
 *
 * Every Life Profile field is nullable - Prompt 1 only auto-provisions a
 * bare row on first visit (all fields `null`); Prompt 2's Life Profile form
 * is what actually fills them in.
 *
 * Deliberately unrelated to the generic planner marketplace's
 * `PlannerDefinition`/`PlannerInstance` types - this is a different
 * product with its own relational shape, not an instance of the generic
 * field-answer wizard.
 */
export interface LifePlan {
  id: string;
  ownerId: string;
  /** `null` means "not set yet" - Life Profile setup never forces a placeholder. */
  planningIdentity: string | null;
  /** `null` means "not set yet" - Life Profile setup never forces a placeholder. */
  currentPriorities: string | null;
  /** `null` means "not set yet" - Life Profile setup never forces a placeholder. */
  importantAreas: string | null;
  /** `null` means "not set yet" - Life Profile setup never forces a placeholder. */
  shortTermDirection: string | null;
  /** `null` means "not set yet" - Life Profile setup never forces a placeholder. */
  longTermDirection: string | null;
  /** `null` means "not set yet" - Life Profile setup never forces a placeholder. */
  planningPreferences: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * The glyph a Life Area is shown with - one of the 9 default areas'
 * thematically-apt icon, or `"other"` for anything that doesn't fit those.
 * A fully custom, user-named area (Prompt 2 Phase 1's own requirement)
 * still picks one of these 9 icons rather than needing a 10th - the name
 * field is what actually makes an area "custom," not a bespoke icon set.
 * Kept as a literal union (not a free string) so `AREA_ICONS`
 * (`@/app/(app)/app/life-planner/areas/_components/area-icon`) can be a
 * `Record` covering every possible value, and the database's
 * `icon_key` column can never drift out of sync with what the UI actually
 * knows how to render.
 */
export const LIFE_AREA_ICON_KEYS = [
  "personal",
  "career",
  "education",
  "finance",
  "health",
  "relationships",
  "home",
  "travel",
  "other",
] as const;

export type LifeAreaIconKey = (typeof LIFE_AREA_ICON_KEYS)[number];

/**
 * The tint a Life Area's icon chip is shown in. Deliberately not a
 * rainbow palette - Everplans' color system (`AGENTS.md`'s own "Color
 * system" section) has exactly one brand hue plus the three status hues,
 * so this union is every semantic tint that actually exists as a design
 * token, not a Life-Planner-specific extension of the palette.
 */
export const LIFE_AREA_COLOR_KEYS = ["neutral", "brand", "accent", "success", "warning", "error"] as const;

export type LifeAreaColorKey = (typeof LIFE_AREA_COLOR_KEYS)[number];

/**
 * A Life Area - `public.life_areas`
 * (`supabase/migrations/20260912000000_life_planner_areas.sql`), the first
 * child table of `LifePlan`. One row per area a user is tracking, ordered
 * by `position`. `isCustom` distinguishes an onboarding default
 * (`ensureDefaultLifeAreas`, `@/lib/life-planner/life-areas`) from one the
 * user added themselves, but carries no behavioral restriction today -
 * both kinds are equally editable and deletable, subject only to the
 * "never leave a user with zero areas" floor `deleteLifeArea` enforces.
 */
export interface LifeArea {
  id: string;
  ownerId: string;
  planId: string;
  name: string;
  /** `null` means "no description written" - never a forced empty string. */
  description: string | null;
  iconKey: LifeAreaIconKey;
  colorKey: LifeAreaColorKey;
  isCustom: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * How urgently a Life Goal is being pursued - a plain three-step scale, not
 * a numeric score, matching the "no gamification" register Prompt 2 Phase 2
 * keeps for goal tracking generally.
 */
export const LIFE_GOAL_PRIORITIES = ["low", "medium", "high"] as const;

export type LifeGoalPriority = (typeof LIFE_GOAL_PRIORITIES)[number];

/**
 * Where a Life Goal stands. `paused` is distinct from `not_started` - a
 * goal that was actively being worked on and has since stalled reads
 * differently from one that was never begun, the same distinction
 * `WeddingVendorStatus`'s `considering`/`not-proceeding` split draws for a
 * different product.
 */
export const LIFE_GOAL_STATUSES = ["not_started", "in_progress", "completed", "paused"] as const;

export type LifeGoalStatus = (typeof LIFE_GOAL_STATUSES)[number];

/**
 * A Life Goal - `public.life_goals`
 * (`supabase/migrations/20260913000000_life_planner_goals.sql`), the second
 * child of `LifePlan` and a sibling (not a child) of `LifeArea` - `lifeAreaId`
 * is an optional, nullable filing reference, not an ownership relationship,
 * so deleting an area never deletes or orphans-invalidly the goals filed
 * under it (`on delete set null`).
 *
 * `progress` is a plain 0-100 integer the user sets directly for now -
 * Prompt 2 Phase 2 deliberately keeps this simple (no gamification, no
 * streaks). Prompt 2 Phase 3's milestones/action steps may later derive and
 * write this value automatically, but the column and its meaning don't
 * change when that lands.
 */
export interface LifeGoal {
  id: string;
  ownerId: string;
  /** `null` means "not filed under a specific area" - never a forced default. */
  lifeAreaId: string | null;
  title: string;
  /** `null` means "no description written" - never a forced empty string. */
  description: string | null;
  /** ISO `YYYY-MM-DD`, or `null` for "no target date set". */
  targetDate: string | null;
  priority: LifeGoalPriority;
  status: LifeGoalStatus;
  progress: number;
  /** `null` means "no notes written" - never a forced empty string. */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Where a Life Goal Milestone stands - a plain three-step scale, the same
 * shape `LifeGoalStatus` uses minus `paused` (a milestone is either not
 * begun, underway, or done - it doesn't have its own "stalled" state
 * independent of the goal it belongs to).
 */
export const LIFE_GOAL_MILESTONE_STATUSES = ["not_started", "in_progress", "completed"] as const;

export type LifeGoalMilestoneStatus = (typeof LIFE_GOAL_MILESTONE_STATUSES)[number];

/**
 * A Life Goal Milestone - `public.life_goal_milestones`
 * (`supabase/migrations/20260914000000_life_planner_goal_planning.sql`), a
 * child of `LifeGoal` (Prompt 2 Phase 3). Ordered by `position` within its
 * own goal - there's no cross-goal ordering, the same "one flat, ordered
 * list per parent" shape `LifeArea.position` uses at the plan level.
 */
export interface LifeGoalMilestone {
  id: string;
  ownerId: string;
  goalId: string;
  title: string;
  status: LifeGoalMilestoneStatus;
  /** ISO `YYYY-MM-DD`, or `null` for "no target date set". */
  targetDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * A Life Goal Action Step - `public.life_goal_action_steps`
 * (`supabase/migrations/20260914000000_life_planner_goal_planning.sql`),
 * also a child of `LifeGoal`, and optionally filed under one of that same
 * goal's milestones (`milestoneId`). `on delete set null` on the
 * `milestone_id` FK means removing a milestone demotes its steps to
 * "unassigned" rather than deleting them - the same "optional filing
 * reference, not an ownership relationship" shape `LifeGoal.lifeAreaId`
 * uses one level up. `isCompleted` is a plain boolean (not a 3-step status
 * like a milestone) - an action step is either done or it isn't.
 */
export interface LifeGoalActionStep {
  id: string;
  ownerId: string;
  goalId: string;
  /** `null` means "not filed under a specific milestone" - shown as "Unassigned" in the UI. */
  milestoneId: string | null;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * How urgently a Life Task needs doing - the same plain three-step scale
 * `LifeGoalPriority` uses, kept as its own distinct union (not a reused
 * alias) since a task and a goal are different concepts even though they
 * currently share the same three labels.
 */
export const LIFE_TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type LifeTaskPriority = (typeof LIFE_TASK_PRIORITIES)[number];

/**
 * Where a Life Task stands - a plain three-step scale, the same shape
 * `LifeGoalMilestoneStatus` uses: a task is either not begun, underway, or
 * done. No `paused` concept the way a goal has one - a task that's stalled
 * is just left `todo` rather than needing its own fourth state.
 */
export const LIFE_TASK_STATUSES = ["todo", "in_progress", "completed"] as const;

export type LifeTaskStatus = (typeof LIFE_TASK_STATUSES)[number];

/**
 * A Life Task - `public.life_tasks`
 * (`supabase/migrations/20260915000000_life_planner_tasks.sql`), a third
 * top-level table alongside `LifeGoal` and `LifeArea` rather than a child of
 * either - `lifeAreaId` and `goalId` are both optional, nullable filing
 * references, not ownership relationships, so deleting an area or a goal
 * never deletes or orphans-invalidly a task filed under it (`on delete set
 * null` on both FKs).
 *
 * `isArchived` is this table's only "delete" affordance from the UI (see
 * `archiveTask`, `@/lib/life-planner/life-tasks`) - a plain hard `deleteTask`
 * exists in the DAL for parity with every other Life Planner table, but the
 * tasks UI never surfaces it as the primary action, the same "archive over
 * delete" register `is_archived` already carries on Home Planner's
 * inventory/maintenance tables.
 */
export interface LifeTask {
  id: string;
  ownerId: string;
  /** `null` means "not filed under a specific area" - never a forced default. */
  lifeAreaId: string | null;
  /** `null` means "not linked to a specific goal" - never a forced default. */
  goalId: string | null;
  title: string;
  /** `null` means "no description written" - never a forced empty string. */
  description: string | null;
  /** ISO `YYYY-MM-DD`, or `null` for "no due date set". */
  dueDate: string | null;
  priority: LifeTaskPriority;
  status: LifeTaskStatus;
  /** Set the moment `status` becomes `completed`; cleared the moment it's reopened. `null` otherwise. */
  completedAt: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * What kind of Routine this is - a light thematic label (Morning/Evening
 * pick an icon/tone in the UI), not a behavioral flag; `frequency` (below)
 * is what actually decides which days a routine is due.
 */
export const LIFE_ROUTINE_TYPES = ["morning", "evening", "weekly", "custom"] as const;

export type LifeRoutineType = (typeof LIFE_ROUTINE_TYPES)[number];

/**
 * How often a Routine repeats. `daily` and `weekdays` are fully determined
 * by the label alone; `weekly` and `custom` both defer to `activeDays` for
 * exactly which days - see `isRoutineDueToday`
 * (`@/lib/life-planner/life-routines`) for the full recurrence rule, kept
 * deliberately simple: a "weekly" routine with no day chosen yet is just
 * never due, rather than this type guessing one on the user's behalf.
 */
export const LIFE_ROUTINE_FREQUENCIES = ["daily", "weekdays", "weekly", "custom"] as const;

export type LifeRoutineFrequency = (typeof LIFE_ROUTINE_FREQUENCIES)[number];

/**
 * A Routine - `public.life_routines`
 * (`supabase/migrations/20260916000000_life_planner_routines.sql`), a
 * fourth top-level table alongside `LifeArea`/`LifeGoal`/`LifeTask` rather
 * than a child of any of them - a routine is a recurring checklist
 * (e.g. "Morning routine") the user works through on the days it's
 * scheduled, independent of any single Life Area or Goal.
 *
 * `isActive` is this table's pause affordance, not its delete one - a
 * paused routine keeps its items and history but stops appearing in
 * "today's routines" (see `isRoutineDueToday`). `deleteRoutine`
 * (`@/lib/life-planner/life-routines`) is the real hard delete, offered
 * alongside pause rather than instead of it.
 */
export interface LifeRoutine {
  id: string;
  ownerId: string;
  name: string;
  /** `null` means "no purpose written" - never a forced empty string. */
  purpose: string | null;
  routineType: LifeRoutineType;
  frequency: LifeRoutineFrequency;
  /** 0=Sunday..6=Saturday. Only meaningful when `frequency` is `"weekly"` or `"custom"` - see `isRoutineDueToday`. Always `[]` for `"daily"`/`"weekdays"`. */
  activeDays: number[];
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One checklist entry within a Routine - `public.life_routine_items`
 * (same migration as `LifeRoutine`), a child of `LifeRoutine`. Ordered by
 * `position` within its own routine - there's no cross-routine ordering,
 * the same "one flat, ordered list per parent" shape `LifeGoalMilestone`
 * uses at the goal level.
 */
export interface LifeRoutineItem {
  id: string;
  ownerId: string;
  routineId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One day a Routine Item was marked done - `public.life_routine_completions`
 * (same migration as `LifeRoutine`), a per-item, per-day log rather than a
 * boolean flag on the item itself, since a routine repeats and "done" has
 * to be scoped to *which day*. `unique (routine_item_id, completed_on)` at
 * the database layer backs `toggleRoutineItemCompletion`'s own
 * insert-or-delete toggle. No `updatedAt` - a completion is either logged
 * for a day or it isn't; there's nothing on the row itself to edit in
 * place.
 */
export interface LifeRoutineCompletion {
  id: string;
  ownerId: string;
  routineItemId: string;
  /** ISO `YYYY-MM-DD` - the calendar day this completion belongs to, not a timestamp. */
  completedOn: string;
  createdAt: string;
}

/**
 * How often a Habit is meant to happen. Structurally simpler than
 * `LifeRoutineFrequency` - a Habit has no `activeDays` day-picker, just this
 * one label:
 * - `"daily"` - once a day, every day. `targetPerPeriod` is always `1` in
 *   practice for this frequency (see `LifeHabit.targetPerPeriod`'s own
 *   comment for the exact quirk this carries).
 * - `"weekly"`/`"x_per_week"` - both reduce to the same underlying rule:
 *   `targetPerPeriod` logged days within the current calendar week (Monday
 *   through Sunday) satisfies the period. The two labels exist so the
 *   creation form can offer "weekly" as a friendlier name for "once a
 *   week" (`targetPerPeriod` defaults to `1`) alongside "x times a week"
 *   for anything higher - see `computeHabitProgress`
 *   (`@/lib/life-planner/life-habits`) for the exact period math both
 *   share.
 */
export const LIFE_HABIT_FREQUENCIES = ["daily", "weekly", "x_per_week"] as const;

export type LifeHabitFrequency = (typeof LIFE_HABIT_FREQUENCIES)[number];

/**
 * A Habit - `public.life_habits`
 * (`supabase/migrations/20260917000000_life_planner_habits.sql`), a sixth
 * top-level table alongside `LifeArea`/`LifeGoal`/`LifeTask`/`LifeRoutine`
 * rather than a child of any of them - `lifeAreaId` and `goalId` are both
 * optional, nullable filing references, not ownership relationships, the
 * same "sibling, not child" shape `LifeTask` already establishes for the
 * same two fields.
 *
 * Structurally flatter than `LifeRoutine`: no sub-items, no per-item
 * completions - a Habit logs itself directly via `LifeHabitLog`.
 *
 * `targetPerPeriod`'s quirk: `public.life_habit_logs` is date-grained (its
 * own `unique (habit_id, logged_on)` allows at most one row per habit per
 * calendar day), so for `frequency: "daily"` a habit can only ever log
 * `0` or `1` time within its own one-day period - `targetPerPeriod` above
 * `1` is simply unreachable for a daily habit, not a richer "log it 3 times
 * today" feature. `computeHabitProgress`
 * (`@/lib/life-planner/life-habits`) documents and enforces this directly
 * (treats the daily period's target as always `1`, regardless of what's
 * stored), and the creation/edit forms hide the target-per-period field for
 * `"daily"` and force it to `1` rather than let a user set a value that can
 * never actually be satisfied. Only `"weekly"`/`"x_per_week"` give this
 * field real meaning - "3 times this week," measured across the 7-day
 * period, where each of those days can independently hold its own log.
 *
 * `isActive` is this table's pause affordance, not its delete one - a
 * paused habit keeps its own log history but stops appearing in "today's
 * habits," the same role `LifeRoutine.isActive` plays for Routines.
 * `deleteHabit` (`@/lib/life-planner/life-habits`) is the real hard delete,
 * offered alongside pause rather than instead of it.
 */
export interface LifeHabit {
  id: string;
  ownerId: string;
  /** `null` means "not filed under a specific area" - never a forced default. */
  lifeAreaId: string | null;
  /** `null` means "not linked to a specific goal" - never a forced default. */
  goalId: string | null;
  name: string;
  /** `null` means "no description written" - never a forced empty string. */
  description: string | null;
  frequency: LifeHabitFrequency;
  /** See this interface's own comment - effectively always `1` for `"daily"`. */
  targetPerPeriod: number;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One day a Habit was logged - `public.life_habit_logs` (same migration as
 * `LifeHabit`), a per-habit, per-day log rather than a boolean flag on the
 * habit itself, the exact same "done has to be scoped to *which day*"
 * reasoning `LifeRoutineCompletion` already documents. `unique (habit_id,
 * logged_on)` at the database layer backs `toggleHabitLogForDate`'s own
 * insert-or-delete toggle. No `updatedAt` - a log is either recorded for a
 * day or it isn't; there's nothing on the row itself to edit in place.
 */
export interface LifeHabitLog {
  id: string;
  ownerId: string;
  habitId: string;
  /** ISO `YYYY-MM-DD` - the calendar day this log belongs to, not a timestamp. */
  loggedOn: string;
  createdAt: string;
}

/**
 * A Weekly Plan - `public.life_weekly_plans`
 * (`supabase/migrations/20260918000000_life_planner_planning.sql`), a
 * seventh top-level table alongside `LifeArea`/`LifeGoal`/`LifeTask`/
 * `LifeRoutine`/`LifeHabit` rather than a child of any of them - one row
 * per user per calendar week, created on demand the first time that week's
 * planning view is visited (`getOrCreateWeeklyPlan`,
 * `@/lib/life-planner/life-planning`), not via a separate onboarding step.
 *
 * `weekStart` is always that week's Monday (`getWeekStartForDate`) - the
 * same Monday-Sunday convention `startOfWeek`
 * (`@/lib/life-planner/life-habits`) already uses for habit streak math,
 * kept consistent here rather than introducing a second week convention.
 */
export interface LifeWeeklyPlan {
  id: string;
  ownerId: string;
  /** ISO `YYYY-MM-DD`, always a Monday. */
  weekStart: string;
  /** `null` means "no notes written" - never a forced empty string. */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A Monthly Plan - `public.life_monthly_plans` (same migration as
 * `LifeWeeklyPlan`), the exact same shape one level up - one row per user
 * per calendar month, `monthStart` always the 1st (`getMonthStartForDate`),
 * created on demand the same way.
 */
export interface LifeMonthlyPlan {
  id: string;
  ownerId: string;
  /** ISO `YYYY-MM-DD`, always the 1st of the month. */
  monthStart: string;
  /** `null` means "no notes written" - never a forced empty string. */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Where a Weekly/Monthly Priority's title came from. `'custom'` (the
 * default) means the user typed it from scratch; `'goal'`/`'task'` mean it
 * was added by promoting an existing `LifeGoal`/`LifeTask` into this
 * period's priority list - `sourceId` then holds that row's own id.
 * Deliberately not a foreign key at the database layer (a single column
 * can't target two different tables), so ownership of whatever `sourceId`
 * points at is verified in application code before a priority is ever
 * allowed to link to it - see `addWeeklyPriority`
 * (`@/lib/life-planner/life-planning`) for the exact guard.
 */
export const LIFE_PLAN_PRIORITY_SOURCE_TYPES = ["goal", "task", "custom"] as const;

export type LifePlanPrioritySourceType = (typeof LIFE_PLAN_PRIORITY_SOURCE_TYPES)[number];

/**
 * One entry in a Weekly Plan's short, user-ordered "what matters this week"
 * list - `public.life_weekly_priorities` (same migration as
 * `LifeWeeklyPlan`), a child of it. Ordered by `position` within its own
 * plan, the same "one flat, ordered list per parent" shape
 * `LifeRoutineItem.position` uses at the routine level. `isDone` is a plain
 * boolean (not a 3-step status) - a priority is either done or it isn't,
 * the same register `LifeGoalActionStep.isCompleted` already uses.
 *
 * A separate type from `LifeMonthlyPriority` (not one shared type with a
 * period-type discriminant) even though the two are structurally identical
 * - each is a child of a different parent table
 * (`weeklyPlanId`/`monthlyPlanId`), the same "each table gets its own
 * mapped type" convention every other Life Planner child table already
 * follows (`LifeRoutineItem` vs. `LifeGoalMilestone`, structurally similar
 * but never merged into one type with a "which parent" flag).
 */
export interface LifeWeeklyPriority {
  id: string;
  ownerId: string;
  weeklyPlanId: string;
  title: string;
  sourceType: LifePlanPrioritySourceType;
  /** `null` for `sourceType: "custom"`; the linked goal/task's own id otherwise. */
  sourceId: string | null;
  isDone: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One entry in a Monthly Plan's own priority list - `public.life_monthly_priorities`
 * (same migration as `LifeMonthlyPlan`), the exact same shape as
 * `LifeWeeklyPriority` one level up - see that type's own comment for why
 * this stays a separate type rather than a shared one with a discriminant.
 */
export interface LifeMonthlyPriority {
  id: string;
  ownerId: string;
  monthlyPlanId: string;
  title: string;
  sourceType: LifePlanPrioritySourceType;
  /** `null` for `sourceType: "custom"`; the linked goal/task's own id otherwise. */
  sourceId: string | null;
  isDone: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * A Journal Entry - `public.life_journal_entries`
 * (`supabase/migrations/20260919000000_life_planner_journal.sql`), Life
 * Planner Prompt 4 Phase 2 - an eighth top-level table alongside
 * `LifeArea`/`LifeGoal`/`LifeTask`/`LifeRoutine`/`LifeHabit`/
 * `LifeWeeklyPlan`/`LifeMonthlyPlan` rather than a child of any of them.
 * `lifeAreaId` and `goalId` are both optional, nullable filing references,
 * not ownership relationships, the same "sibling, not child" shape
 * `LifeTask` already establishes for the same two fields.
 *
 * This is the most sensitive personal data in the entire product - private
 * reflective writing, never a shared plan or checklist. RLS
 * (`owner_id = auth.uid()`, see the migration's own comment) is the *only*
 * access boundary this table has; there is deliberately no service-role or
 * admin escape hatch the way some commerce tables carry one elsewhere in
 * this schema.
 *
 * `isArchived` is this table's soft-delete affordance, the same primary
 * "remove from view" role `LifeTask.isArchived` plays - `deleteJournalEntry`
 * (`@/lib/life-planner/life-journal`) is the real hard delete, offered
 * alongside archive rather than instead of it, for genuine removal.
 */
export interface LifeJournalEntry {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  /** ISO `YYYY-MM-DD` - the calendar day this entry is dated to (defaults to today at creation, but editable - a reflection written today about yesterday is still dated yesterday). */
  entryDate: string;
  /** `null` means "not filed under a specific area" - never a forced default. */
  lifeAreaId: string | null;
  /** `null` means "not linked to a specific goal" - never a forced default. */
  goalId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * What kind of "important thing" a `LifeImportantItem` is - a plain
 * browsing/filtering label, not a behavioral flag (every category is stored,
 * edited, archived, and deleted identically). `"note"` is the default for
 * anything not deliberately categorized, the same "least-commitment default"
 * role a plain string category plays elsewhere in this schema.
 */
export const LIFE_IMPORTANT_ITEM_CATEGORIES = ["plan", "intention", "milestone", "reference", "note", "other"] as const;

export type LifeImportantItemCategory = (typeof LIFE_IMPORTANT_ITEM_CATEGORIES)[number];

/**
 * An Important Item - `public.life_important_items`
 * (`supabase/migrations/20260920000000_life_planner_important_items.sql`),
 * Life Planner Prompt 4 Phase 3 - a ninth top-level table alongside
 * `LifeArea`/`LifeGoal`/`LifeTask`/`LifeRoutine`/`LifeHabit`/
 * `LifeWeeklyPlan`/`LifeMonthlyPlan`/`LifeJournalEntry` rather than a child
 * of any of them. `lifeAreaId` and `goalId` are both optional, nullable
 * filing references, not ownership relationships, the same "sibling, not
 * child" shape `LifeJournalEntry` already establishes for the same two
 * fields.
 *
 * Distinct in register from `LifeJournalEntry`: a Journal Entry is dated,
 * private reflective writing; an Important Item is undated reference
 * material - a plan, an intention, a milestone note, a reference detail, or
 * a plain note worth keeping close and revisiting, closer to a personal
 * archive entry than a diary page. This is why it carries `category` instead
 * of `entryDate`, and no separate "search" story beyond category/area/goal
 * filtering - see `getImportantItemsForCurrentUser`
 * (`@/lib/life-planner/life-important-items`).
 *
 * Private personal data, the same RLS-only access boundary
 * `LifeJournalEntry` documents - no service-role or admin escape hatch.
 *
 * `isArchived` is this table's soft-delete affordance, the same primary
 * "remove from view" role `LifeJournalEntry.isArchived` plays -
 * `deleteImportantItem` (`@/lib/life-planner/life-important-items`) is the
 * real hard delete, offered alongside archive rather than instead of it, for
 * genuine removal.
 */
export interface LifeImportantItem {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  category: LifeImportantItemCategory;
  /** `null` means "not filed under a specific area" - never a forced default. */
  lifeAreaId: string | null;
  /** `null` means "not linked to a specific goal" - never a forced default. */
  goalId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

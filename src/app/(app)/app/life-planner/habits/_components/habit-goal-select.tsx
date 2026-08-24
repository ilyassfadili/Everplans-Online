import { Select } from "@/components/ui";
import type { LifeGoal } from "@/types/life-planner";

/** Sentinel for "no goal" - Radix's `Select.Item` can't take a genuinely empty `value` (same constraint `GoalAreaSelect`'s own `NO_AREA_VALUE`/`TaskGoalSelect`'s own `NO_GOAL_VALUE` work around). */
export const NO_GOAL_VALUE = "none";

/** Normalizes `NO_GOAL_VALUE` back to an empty field - the same shape the DAL's own `optionalUuidSchema` already treats as "no goal". Lives here (not `actions.ts`) because a `"use server"` file may only export async Server Actions. */
export function normalizeGoalId(value: string): string {
  return value === NO_GOAL_VALUE ? "" : value;
}

interface HabitGoalSelectProps {
  goals: LifeGoal[];
  defaultValue?: string;
  name?: string;
  id?: string;
}

/** The "which Life Goal is this habit linked to" control, used by the New Habit form and the habit detail page's full edit form - the same "each module owns a small local copy" shape `TaskGoalSelect` (`@/app/(app)/app/life-planner/tasks/_components/task-goal-select`) already establishes rather than importing across modules. */
export function HabitGoalSelect({ goals, defaultValue, name = "goalId", id }: HabitGoalSelectProps) {
  const options = [{ value: NO_GOAL_VALUE, label: "No goal" }, ...goals.map((goal) => ({ value: goal.id, label: goal.title }))];

  return <Select id={id} name={name} defaultValue={defaultValue ?? NO_GOAL_VALUE} options={options} aria-label="Goal" />;
}

import { Select } from "@/components/ui";
import type { LifeArea } from "@/types/life-planner";

/** Sentinel for "no Life Area" - Radix's `Select.Item` can't take a genuinely empty `value` (same constraint `TransactionsFilterBar`'s own `ALL_VALUE` sentinel works around). The form actions treat this the same as an omitted field. */
export const NO_AREA_VALUE = "none";

/** Normalizes `NO_AREA_VALUE` back to an empty field - the same shape the DAL's own `lifeAreaIdSchema` already treats as "no area". Lives here (not `actions.ts`) because a `"use server"` file may only export async Server Actions. */
export function normalizeAreaId(value: string): string {
  return value === NO_AREA_VALUE ? "" : value;
}

interface GoalAreaSelectProps {
  areas: LifeArea[];
  defaultValue?: string;
  name?: string;
  id?: string;
}

/** The "which Life Area is this goal filed under" control, shared by the New Goal form and the detail page's edit form. */
export function GoalAreaSelect({ areas, defaultValue, name = "lifeAreaId", id }: GoalAreaSelectProps) {
  const options = [{ value: NO_AREA_VALUE, label: "No area" }, ...areas.map((area) => ({ value: area.id, label: area.name }))];

  return <Select id={id} name={name} defaultValue={defaultValue ?? NO_AREA_VALUE} options={options} aria-label="Life Area" />;
}

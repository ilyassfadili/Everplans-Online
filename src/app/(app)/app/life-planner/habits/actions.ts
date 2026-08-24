"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  activateHabit,
  createHabit,
  deactivateHabit,
  deleteHabit,
  toggleHabitLogForDate,
  updateHabit,
  type CreateHabitInput,
  type HabitLogMutationResult,
  type LifeHabitDeleteResult,
  type LifeHabitMutationResult,
  type UpdateHabitInput,
} from "@/lib/life-planner/life-habits";

/**
 * The Habits module's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-habits`, the same "`useActionState`-compatible
 * wrapper for create, plain async functions for edit/delete/toggle called
 * directly from client components" split every other Life Planner module's
 * own `actions.ts` uses (`routines/actions.ts` is the closest structural
 * twin).
 *
 * Every mutation revalidates the habits list, every habit detail page, the
 * dashboard (whose "Today's habits" section reads the same data), and every
 * goal detail page (whose own "Habits for this goal" section can also
 * toggle a log) - `revalidatePath` with the `"page"` type against
 * `"/app/life-planner/habits/[habitId]"` and
 * `"/app/life-planner/goals/[goalId]"` revalidates every instance of those
 * routes in one call each, the same trick `revalidateRoutinePages`
 * (`@/app/(app)/app/life-planner/routines/actions.ts`) uses for routine
 * detail pages.
 */

function revalidateHabitPages() {
  revalidatePath("/app/life-planner/habits");
  revalidatePath("/app/life-planner/habits/[habitId]", "page");
  revalidatePath("/app/life-planner/goals/[goalId]", "page");
  revalidatePath("/app/life-planner");
}

export interface CreateHabitFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/** The "New habit" page's own form action - redirects straight to the new habit's own detail page on success, the same "dedicated route, not an expand-in-place panel" shape `createRoutineFormAction` uses. */
export async function createHabitFormAction(_prevState: CreateHabitFormState, formData: FormData): Promise<CreateHabitFormState> {
  const name = formData.get("name");
  const description = formData.get("description");
  const lifeAreaId = formData.get("lifeAreaId");
  const goalId = formData.get("goalId");
  const frequency = formData.get("frequency");
  const targetPerPeriod = formData.get("targetPerPeriod");

  const input: CreateHabitInput = {
    name: typeof name === "string" ? name : "",
    description: typeof description === "string" ? description : undefined,
    lifeAreaId: typeof lifeAreaId === "string" ? lifeAreaId : undefined,
    goalId: typeof goalId === "string" ? goalId : undefined,
    // Cast, not trusted blindly - `createHabit`'s own zod schema re-validates
    // against the real enum; this only satisfies the input type for a value
    // the form's own `<Select>` already constrains.
    frequency: typeof frequency === "string" && frequency ? (frequency as CreateHabitInput["frequency"]) : undefined,
    targetPerPeriod: typeof targetPerPeriod === "string" && targetPerPeriod ? Number(targetPerPeriod) : undefined,
  };

  const result = await createHabit(input);

  if (result.status === "success") {
    revalidateHabitPages();
    redirect(`/app/life-planner/habits/${result.habit.id}`);
  }

  return { status: result.status, message: result.message };
}

export async function updateHabitAction(habitId: string, input: UpdateHabitInput): Promise<LifeHabitMutationResult> {
  const result = await updateHabit(habitId, input);
  if (result.status === "success") {
    revalidateHabitPages();
  }
  return result;
}

export async function deactivateHabitAction(habitId: string): Promise<LifeHabitMutationResult> {
  const result = await deactivateHabit(habitId);
  if (result.status === "success") {
    revalidateHabitPages();
  }
  return result;
}

export async function activateHabitAction(habitId: string): Promise<LifeHabitMutationResult> {
  const result = await activateHabit(habitId);
  if (result.status === "success") {
    revalidateHabitPages();
  }
  return result;
}

export async function deleteHabitAction(habitId: string): Promise<LifeHabitDeleteResult> {
  const result = await deleteHabit(habitId);
  if (result.status === "success") {
    revalidateHabitPages();
  }
  return result;
}

/** The completion toggle's own action, shared by every place a habit's "log today" checkbox appears - the dashboard's "Today's habits" section, the Habits list page, the habit detail page, and a goal's own "Habits for this goal" section. */
export async function toggleHabitLogForDateAction(habitId: string, date: string): Promise<HabitLogMutationResult> {
  const result = await toggleHabitLogForDate(habitId, date);
  if (result.status === "success") {
    revalidateHabitPages();
  }
  return result;
}

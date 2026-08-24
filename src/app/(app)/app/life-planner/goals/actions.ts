"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  createLifeGoal,
  deleteLifeGoal,
  updateLifeGoal,
  type CreateLifeGoalInput,
  type DeleteLifeGoalResult,
  type LifeGoalMutationResult,
  type UpdateLifeGoalInput,
} from "@/lib/life-planner/life-goals";

import { normalizeAreaId } from "./_components/goal-area-select";

/**
 * The Goals module's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-goals`, the same "`useActionState`-compatible
 * wrapper for create, plain async functions for edit/delete called directly
 * from client components" split `@/app/(app)/app/life-planner/areas/actions.ts`
 * uses.
 *
 * Every mutation revalidates the goals list and the dashboard, since the
 * dashboard's own compact goals preview reads the same data.
 */

function revalidateGoalPages() {
  revalidatePath("/app/life-planner/goals");
  revalidatePath("/app/life-planner");
}

export interface CreateLifeGoalFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/**
 * The "New goal" page's form action - unlike `createLifeAreaFormAction`,
 * this redirects straight to the new goal's own detail page on success
 * rather than resetting an inline form, since "New goal" is a dedicated
 * route (Phase 2 §4), not an expand-in-place panel on the list page.
 */
export async function createLifeGoalFormAction(_prevState: CreateLifeGoalFormState, formData: FormData): Promise<CreateLifeGoalFormState> {
  const title = formData.get("title");
  const description = formData.get("description");
  const lifeAreaId = formData.get("lifeAreaId");
  const targetDate = formData.get("targetDate");
  const priority = formData.get("priority");
  const notes = formData.get("notes");

  const input: CreateLifeGoalInput = {
    title: typeof title === "string" ? title : "",
    description: typeof description === "string" ? description : undefined,
    lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : undefined,
    targetDate: typeof targetDate === "string" ? targetDate : undefined,
    // Cast, not trusted blindly - `createLifeGoal`'s own zod schema
    // re-validates against the real enum; this only satisfies the input
    // type for a value the form's own `<Select>` already constrains.
    priority: typeof priority === "string" && priority ? (priority as CreateLifeGoalInput["priority"]) : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  };

  const result = await createLifeGoal(input);

  if (result.status === "success") {
    revalidateGoalPages();
    redirect(`/app/life-planner/goals/${result.goal.id}`);
  }

  return { status: result.status, message: result.message };
}

export async function updateLifeGoalAction(goalId: string, input: UpdateLifeGoalInput): Promise<LifeGoalMutationResult> {
  const result = await updateLifeGoal(goalId, input);
  if (result.status === "success") {
    revalidateGoalPages();
  }
  return result;
}

export async function deleteLifeGoalAction(goalId: string): Promise<DeleteLifeGoalResult> {
  const result = await deleteLifeGoal(goalId);
  if (result.status === "success") {
    revalidateGoalPages();
  }
  return result;
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  activateRoutine,
  addRoutineItem,
  createRoutine,
  deactivateRoutine,
  deleteRoutine,
  deleteRoutineItem,
  reorderRoutineItem,
  toggleRoutineItemCompletion,
  updateRoutine,
  updateRoutineItem,
  type CreateRoutineInput,
  type LifeRoutineDeleteResult,
  type LifeRoutineItemMutationResult,
  type LifeRoutineMutationResult,
  type RoutineCompletionMutationResult,
  type UpdateRoutineInput,
} from "@/lib/life-planner/life-routines";

/**
 * The Routines module's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-routines`, the same "`useActionState`-compatible
 * wrapper for create, plain async functions for edit/delete/reorder/toggle
 * called directly from client components" split every other Life Planner
 * module's own `actions.ts` uses. One file covers both routine-level and
 * item-level mutations (Phase 2's own instruction) rather than splitting
 * item mutations into a nested `[routineId]/actions.ts` the way goal
 * planning does - a routine's items are this module's *only* nested
 * concern, so the split goal planning needs (Milestones + Action Steps,
 * both under one goal) doesn't earn its own file here.
 *
 * Every mutation revalidates the routines list, every routine detail page,
 * and the dashboard (whose "Today's routines" section reads the same data)
 * - `revalidatePath` with the `"page"` type against
 * `"/app/life-planner/routines/[routineId]"` revalidates every instance of
 * that route in one call, the same trick `revalidateTaskPages`
 * (`@/app/(app)/app/life-planner/tasks/actions.ts`) uses for task detail
 * pages.
 */

function revalidateRoutinePages() {
  revalidatePath("/app/life-planner/routines");
  revalidatePath("/app/life-planner/routines/[routineId]", "page");
  revalidatePath("/app/life-planner");
}

// ---------------------------------------------------------------------------
// Routines
// ---------------------------------------------------------------------------

export interface CreateRoutineFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

function parseActiveDaysFormValues(formData: FormData): number[] {
  return formData
    .getAll("activeDays")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
}

/** The "New routine" page's own form action - redirects straight to the new routine's own detail page on success, the same "dedicated route, not an expand-in-place panel" shape `createLifeGoalFormAction` uses, so the user lands right where they can start adding items. */
export async function createRoutineFormAction(_prevState: CreateRoutineFormState, formData: FormData): Promise<CreateRoutineFormState> {
  const name = formData.get("name");
  const purpose = formData.get("purpose");
  const routineType = formData.get("routineType");
  const frequency = formData.get("frequency");

  const input: CreateRoutineInput = {
    name: typeof name === "string" ? name : "",
    purpose: typeof purpose === "string" ? purpose : undefined,
    // Cast, not trusted blindly - `createRoutine`'s own zod schema
    // re-validates each against the real enum; this only satisfies the
    // input type for a value the form's own `<Select>` already constrains.
    routineType: typeof routineType === "string" && routineType ? (routineType as CreateRoutineInput["routineType"]) : undefined,
    frequency: typeof frequency === "string" && frequency ? (frequency as CreateRoutineInput["frequency"]) : undefined,
    activeDays: parseActiveDaysFormValues(formData),
  };

  const result = await createRoutine(input);

  if (result.status === "success") {
    revalidateRoutinePages();
    redirect(`/app/life-planner/routines/${result.routine.id}`);
  }

  return { status: result.status, message: result.message };
}

export async function updateRoutineAction(routineId: string, input: UpdateRoutineInput): Promise<LifeRoutineMutationResult> {
  const result = await updateRoutine(routineId, input);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

export async function deactivateRoutineAction(routineId: string): Promise<LifeRoutineMutationResult> {
  const result = await deactivateRoutine(routineId);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

export async function activateRoutineAction(routineId: string): Promise<LifeRoutineMutationResult> {
  const result = await activateRoutine(routineId);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

export async function deleteRoutineAction(routineId: string): Promise<LifeRoutineDeleteResult> {
  const result = await deleteRoutine(routineId);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

// ---------------------------------------------------------------------------
// Routine items
// ---------------------------------------------------------------------------

export interface AddRoutineItemFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/** The routine detail page's own "Add item" form action - bound to `routineId` the same way `createMilestoneFormAction` binds to `goalId`. */
export async function addRoutineItemFormAction(routineId: string, _prevState: AddRoutineItemFormState, formData: FormData): Promise<AddRoutineItemFormState> {
  const title = formData.get("title");

  const result = await addRoutineItem(routineId, typeof title === "string" ? title : "");

  if (result.status === "success") {
    revalidateRoutinePages();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function updateRoutineItemAction(itemId: string, title: string): Promise<LifeRoutineItemMutationResult> {
  const result = await updateRoutineItem(itemId, title);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

export async function deleteRoutineItemAction(itemId: string): Promise<LifeRoutineDeleteResult> {
  const result = await deleteRoutineItem(itemId);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

export async function moveRoutineItemAction(itemId: string, direction: "up" | "down"): Promise<LifeRoutineDeleteResult> {
  const result = await reorderRoutineItem(itemId, direction);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

/** The completion checkbox's own action, shared by the dashboard's "Today's routines" section and the routine detail page's own "Today's checklist" - both read the same `getTodaysRoutineItemsForCurrentUser()` data, so both revalidate through the same `revalidateRoutinePages`. */
export async function toggleRoutineItemCompletionAction(itemId: string, date: string): Promise<RoutineCompletionMutationResult> {
  const result = await toggleRoutineItemCompletion(itemId, date);
  if (result.status === "success") {
    revalidateRoutinePages();
  }
  return result;
}

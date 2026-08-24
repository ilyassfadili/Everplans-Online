"use server";

import { revalidatePath } from "next/cache";

import {
  createLifeArea,
  deleteLifeArea,
  moveLifeArea,
  updateLifeArea,
  type CreateLifeAreaInput,
  type DeleteLifeAreaResult,
  type LifeAreaMutationResult,
  type UpdateLifeAreaInput,
} from "@/lib/life-planner/life-areas";
import type { LifeAreaColorKey, LifeAreaIconKey } from "@/types/life-planner";

/**
 * The Life Areas page's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-areas`, the same "`useActionState`-compatible
 * wrapper for create, plain async functions for edit/delete/reorder called
 * directly from client components" split
 * `@/app/(app)/app/budget-planner/categories/actions.ts` uses.
 *
 * Every mutation revalidates both this page and the dashboard, since
 * `LifeAreasPreview` (`@/app/(app)/app/life-planner/_components/life-areas-preview`)
 * reads the same list on `/app/life-planner` itself.
 */

function revalidateLifeAreaPages() {
  revalidatePath("/app/life-planner/areas");
  revalidatePath("/app/life-planner");
}

export interface CreateLifeAreaFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createLifeAreaFormAction(
  planId: string,
  _prevState: CreateLifeAreaFormState,
  formData: FormData,
): Promise<CreateLifeAreaFormState> {
  const name = formData.get("name");
  const description = formData.get("description");
  const iconKey = formData.get("iconKey");
  const colorKey = formData.get("colorKey");

  const input: CreateLifeAreaInput = {
    name: typeof name === "string" ? name : "",
    description: typeof description === "string" ? description : undefined,
    // Cast, not trusted blindly - `createLifeArea`'s own zod schema
    // re-validates each against the real enum; this only satisfies the
    // input type for a value the form's own `<Select>` already constrains.
    iconKey: typeof iconKey === "string" && iconKey ? (iconKey as LifeAreaIconKey) : undefined,
    colorKey: typeof colorKey === "string" && colorKey ? (colorKey as LifeAreaColorKey) : undefined,
  };

  const result = await createLifeArea(planId, input);

  if (result.status === "success") {
    revalidateLifeAreaPages();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function updateLifeAreaAction(areaId: string, input: UpdateLifeAreaInput): Promise<LifeAreaMutationResult> {
  const result = await updateLifeArea(areaId, input);
  if (result.status === "success") {
    revalidateLifeAreaPages();
  }
  return result;
}

export async function deleteLifeAreaAction(areaId: string): Promise<DeleteLifeAreaResult> {
  const result = await deleteLifeArea(areaId);
  if (result.status === "success") {
    revalidateLifeAreaPages();
  }
  return result;
}

export async function moveLifeAreaAction(areaId: string, direction: "up" | "down"): Promise<DeleteLifeAreaResult> {
  const result = await moveLifeArea(areaId, direction);
  if (result.status === "success") {
    revalidateLifeAreaPages();
  }
  return result;
}

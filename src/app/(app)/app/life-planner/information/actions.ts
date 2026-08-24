"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  archiveImportantItem,
  createImportantItem,
  deleteImportantItem,
  unarchiveImportantItem,
  updateImportantItem,
  type CreateImportantItemInput,
  type DeleteImportantItemResult,
  type LifeImportantItemMutationResult,
  type UpdateImportantItemInput,
} from "@/lib/life-planner/life-important-items";
import { LIFE_IMPORTANT_ITEM_CATEGORIES, type LifeImportantItemCategory } from "@/types/life-planner";

import { normalizeAreaId } from "../goals/_components/goal-area-select";
import { normalizeGoalId } from "../tasks/_components/task-goal-select";

/**
 * The Important Items module's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-important-items`, the same "`useActionState`-
 * compatible wrapper for create, plain async functions for edit/archive/
 * delete called directly from client components" split every other Life
 * Planner module's own `actions.ts` uses (see `../journal/actions.ts`).
 *
 * Every mutation revalidates the list, this item's own detail page (when it
 * has one), and the dashboard, since the dashboard's own compact preview
 * reads the same data. A create/archive/delete also revalidates the linked
 * goal's detail page (when there is one) - its own "Important information"
 * section reads the same data too.
 */

function revalidateInformationPages(itemId?: string, goalId?: string | null) {
  revalidatePath("/app/life-planner/information");
  revalidatePath("/app/life-planner");
  if (itemId) {
    revalidatePath(`/app/life-planner/information/${itemId}`);
  }
  if (goalId) {
    revalidatePath(`/app/life-planner/goals/${goalId}`);
  }
}

function parseCategory(value: FormDataEntryValue | null): LifeImportantItemCategory | undefined {
  return typeof value === "string" && (LIFE_IMPORTANT_ITEM_CATEGORIES as readonly string[]).includes(value) ? (value as LifeImportantItemCategory) : undefined;
}

export interface CreateImportantItemFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/**
 * The composer's own form action - redirects straight to the new item's own
 * detail page on success, the same "New goal"/"New journal entry" pattern
 * `createJournalEntryFormAction` uses one module over, since this is a
 * dedicated composer page, not an expand-in-place panel.
 */
export async function createImportantItemFormAction(_prevState: CreateImportantItemFormState, formData: FormData): Promise<CreateImportantItemFormState> {
  const title = formData.get("title");
  const content = formData.get("content");
  const lifeAreaId = formData.get("lifeAreaId");
  const goalId = formData.get("goalId");

  const input: CreateImportantItemInput = {
    title: typeof title === "string" ? title : "",
    content: typeof content === "string" ? content : "",
    category: parseCategory(formData.get("category")),
    lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : undefined,
    goalId: typeof goalId === "string" ? normalizeGoalId(goalId) : undefined,
  };

  const result = await createImportantItem(input);

  if (result.status === "success") {
    revalidateInformationPages(result.item.id, result.item.goalId);
    redirect(`/app/life-planner/information/${result.item.id}`);
  }

  return { status: result.status, message: result.message };
}

export async function updateImportantItemAction(itemId: string, input: UpdateImportantItemInput): Promise<LifeImportantItemMutationResult> {
  const result = await updateImportantItem(itemId, input);
  if (result.status === "success") {
    revalidateInformationPages(itemId, result.item.goalId);
  }
  return result;
}

export async function archiveImportantItemAction(itemId: string): Promise<LifeImportantItemMutationResult> {
  const result = await archiveImportantItem(itemId);
  if (result.status === "success") {
    revalidateInformationPages(itemId, result.item.goalId);
  }
  return result;
}

export async function unarchiveImportantItemAction(itemId: string): Promise<LifeImportantItemMutationResult> {
  const result = await unarchiveImportantItem(itemId);
  if (result.status === "success") {
    revalidateInformationPages(itemId, result.item.goalId);
  }
  return result;
}

export async function deleteImportantItemAction(itemId: string, goalId: string | null): Promise<DeleteImportantItemResult> {
  const result = await deleteImportantItem(itemId);
  if (result.status === "success") {
    revalidateInformationPages(itemId, goalId);
  }
  return result;
}

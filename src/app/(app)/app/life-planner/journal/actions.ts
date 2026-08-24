"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  archiveJournalEntry,
  createJournalEntry,
  deleteJournalEntry,
  unarchiveJournalEntry,
  updateJournalEntry,
  type CreateJournalEntryInput,
  type DeleteJournalEntryResult,
  type LifeJournalEntryMutationResult,
  type UpdateJournalEntryInput,
} from "@/lib/life-planner/life-journal";

import { normalizeAreaId } from "../goals/_components/goal-area-select";
import { normalizeGoalId } from "../tasks/_components/task-goal-select";

/**
 * The Journal module's own Server Actions - thin wrappers around
 * `@/lib/life-planner/life-journal`, the same "`useActionState`-compatible
 * wrapper for create, plain async functions for edit/archive/delete called
 * directly from client components" split every other Life Planner module's
 * own `actions.ts` uses.
 *
 * Every mutation revalidates the journal list, this entry's own detail page
 * (when it has one), and the dashboard, since the dashboard's own "Recent
 * reflections" preview reads the same data. A create/archive/delete also
 * revalidates the linked goal's detail page (when there is one) - its own
 * "Journal reflections" section reads the same data too.
 */

function revalidateJournalPages(entryId?: string, goalId?: string | null) {
  revalidatePath("/app/life-planner/journal");
  revalidatePath("/app/life-planner");
  if (entryId) {
    revalidatePath(`/app/life-planner/journal/${entryId}`);
  }
  if (goalId) {
    revalidatePath(`/app/life-planner/goals/${goalId}`);
  }
}

export interface CreateJournalEntryFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/**
 * The composer's own form action - unlike a quick-add form, this redirects
 * straight to the new entry's own detail page on success, the same "New
 * goal" pattern `createLifeGoalFormAction` uses, since journaling is a
 * dedicated page, not an expand-in-place panel.
 */
export async function createJournalEntryFormAction(_prevState: CreateJournalEntryFormState, formData: FormData): Promise<CreateJournalEntryFormState> {
  const title = formData.get("title");
  const content = formData.get("content");
  const entryDate = formData.get("entryDate");
  const lifeAreaId = formData.get("lifeAreaId");
  const goalId = formData.get("goalId");

  const input: CreateJournalEntryInput = {
    title: typeof title === "string" ? title : "",
    content: typeof content === "string" ? content : "",
    entryDate: typeof entryDate === "string" ? entryDate : undefined,
    lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : undefined,
    goalId: typeof goalId === "string" ? normalizeGoalId(goalId) : undefined,
  };

  const result = await createJournalEntry(input);

  if (result.status === "success") {
    revalidateJournalPages(result.entry.id, result.entry.goalId);
    redirect(`/app/life-planner/journal/${result.entry.id}`);
  }

  return { status: result.status, message: result.message };
}

export async function updateJournalEntryAction(entryId: string, input: UpdateJournalEntryInput): Promise<LifeJournalEntryMutationResult> {
  const result = await updateJournalEntry(entryId, input);
  if (result.status === "success") {
    revalidateJournalPages(entryId, result.entry.goalId);
  }
  return result;
}

export async function archiveJournalEntryAction(entryId: string): Promise<LifeJournalEntryMutationResult> {
  const result = await archiveJournalEntry(entryId);
  if (result.status === "success") {
    revalidateJournalPages(entryId, result.entry.goalId);
  }
  return result;
}

export async function unarchiveJournalEntryAction(entryId: string): Promise<LifeJournalEntryMutationResult> {
  const result = await unarchiveJournalEntry(entryId);
  if (result.status === "success") {
    revalidateJournalPages(entryId, result.entry.goalId);
  }
  return result;
}

export async function deleteJournalEntryAction(entryId: string, goalId: string | null): Promise<DeleteJournalEntryResult> {
  const result = await deleteJournalEntry(entryId);
  if (result.status === "success") {
    revalidateJournalPages(entryId, goalId);
  }
  return result;
}

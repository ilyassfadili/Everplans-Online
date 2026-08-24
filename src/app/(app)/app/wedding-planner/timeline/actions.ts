"use server";

import { revalidatePath } from "next/cache";

import {
  createImportantDate,
  deleteImportantDate,
  updateImportantDate,
  type ImportantDateMutationResult,
  type UpdateImportantDateInput,
} from "@/lib/wedding/important-dates";
import { updateWeddingDate } from "@/lib/wedding/weddings";
import type { CreateWeddingResult } from "@/lib/wedding/weddings";

/**
 * The timeline's own Server Actions - thin wrappers around
 * `@/lib/wedding/important-dates` and the wedding date's own update
 * function, following the same split every other mutation in this
 * codebase uses. Colocated here (not in the shared `wedding-planner/actions.ts`)
 * because only this one route mutates important dates - unlike tasks,
 * nothing else reads or writes them yet.
 */

const TIMELINE_PATH = "/app/wedding-planner/timeline";
const WEDDING_PLANNER_PATH = "/app/wedding-planner";

function revalidateTimeline() {
  revalidatePath(TIMELINE_PATH);
  revalidatePath(WEDDING_PLANNER_PATH);
}

export interface CreateImportantDateFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createImportantDateFormAction(
  weddingId: string,
  _prevState: CreateImportantDateFormState,
  formData: FormData,
): Promise<CreateImportantDateFormState> {
  const title = formData.get("title");
  const eventDate = formData.get("eventDate");
  const eventTime = formData.get("eventTime");

  const result = await createImportantDate(weddingId, {
    title: typeof title === "string" ? title : "",
    eventDate: typeof eventDate === "string" ? eventDate : "",
    eventTime: typeof eventTime === "string" ? eventTime : undefined,
  });

  if (result.status === "success") {
    revalidateTimeline();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editImportantDateAction(
  dateId: string,
  input: UpdateImportantDateInput,
): Promise<ImportantDateMutationResult> {
  const result = await updateImportantDate(dateId, input);
  if (result.status === "success") {
    revalidateTimeline();
  }
  return result;
}

export async function removeImportantDateAction(dateId: string): Promise<void> {
  await deleteImportantDate(dateId);
  revalidateTimeline();
}

export async function editWeddingDateAction(weddingId: string, weddingDate: string | null): Promise<CreateWeddingResult> {
  const result = await updateWeddingDate(weddingId, weddingDate);
  if (result.status === "success") {
    revalidateTimeline();
  }
  return result;
}

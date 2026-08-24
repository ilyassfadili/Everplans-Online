"use server";

import { revalidatePath } from "next/cache";

import {
  createTravelDocument,
  deleteTravelDocument,
  updateTravelDocument,
  type DeleteTravelDocumentResult,
  type TravelDocumentInput,
  type TravelDocumentMutationResult,
} from "@/lib/travel/documents";

/**
 * The Documents page's own Server Actions - thin wrappers around
 * `@/lib/travel/documents`, the same split every other mutation in this
 * codebase uses. Every successful mutation revalidates this page and the
 * dashboard.
 */

const DOCUMENTS_PATH = "/app/travel-planner/documents";
const DASHBOARD_PATH = "/app/travel-planner";

function revalidateDocuments() {
  revalidatePath(DOCUMENTS_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function createTravelDocumentAction(tripId: string, input: TravelDocumentInput): Promise<TravelDocumentMutationResult> {
  const result = await createTravelDocument(tripId, input);
  if (result.status === "success") {
    revalidateDocuments();
  }
  return result;
}

export async function updateTravelDocumentAction(documentId: string, input: TravelDocumentInput): Promise<TravelDocumentMutationResult> {
  const result = await updateTravelDocument(documentId, input);
  if (result.status === "success") {
    revalidateDocuments();
  }
  return result;
}

export async function deleteTravelDocumentAction(documentId: string): Promise<DeleteTravelDocumentResult> {
  const result = await deleteTravelDocument(documentId);
  if (result.status === "success") {
    revalidateDocuments();
  }
  return result;
}

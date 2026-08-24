"use server";

import { revalidatePath } from "next/cache";

import { createDecision, deleteDecision, updateDecision, type DecisionMutationResult } from "@/lib/wedding/decisions";
import { deleteDocument, getDocumentSignedUrl, uploadDocument, type DocumentMutationResult } from "@/lib/wedding/documents";
import { createNote, deleteNote } from "@/lib/wedding/notes";

/**
 * Notes, decisions, and documents' own Server Actions - thin wrappers
 * around `@/lib/wedding/{notes,decisions,documents}`. All three are
 * colocated in one file, matching how they're one combined page (Phase
 * 3's own framing as one continuous "lightweight information layer"
 * feature, not three separate products).
 */

const NOTES_PATH = "/app/wedding-planner/notes";

function revalidateNotes() {
  revalidatePath(NOTES_PATH);
}

function parseRelatedEntity(value: FormDataEntryValue | null): { relatedEntityType?: string; relatedEntityId?: string } {
  if (typeof value !== "string" || !value) return {};
  const [type, id] = value.split(":");
  if (!type || !id) return {};
  return { relatedEntityType: type, relatedEntityId: id };
}

export interface CreateNoteFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createNoteFormAction(weddingId: string, _prevState: CreateNoteFormState, formData: FormData): Promise<CreateNoteFormState> {
  const title = formData.get("title");
  const content = formData.get("content");
  const relatedEntity = parseRelatedEntity(formData.get("relatedEntity"));

  const result = await createNote(weddingId, {
    title: typeof title === "string" ? title : "",
    content: typeof content === "string" ? content : undefined,
    ...relatedEntity,
  });

  if (result.status === "success") {
    revalidateNotes();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function removeNoteAction(noteId: string): Promise<void> {
  await deleteNote(noteId);
  revalidateNotes();
}

export interface CreateDecisionFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createDecisionFormAction(weddingId: string, _prevState: CreateDecisionFormState, formData: FormData): Promise<CreateDecisionFormState> {
  const title = formData.get("title");
  const description = formData.get("description");
  const relatedEntity = parseRelatedEntity(formData.get("relatedEntity"));

  const result = await createDecision(weddingId, {
    title: typeof title === "string" ? title : "",
    description: typeof description === "string" ? description : undefined,
    ...relatedEntity,
  });

  if (result.status === "success") {
    revalidateNotes();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function toggleDecisionStatusAction(decisionId: string, status: "open" | "decided"): Promise<DecisionMutationResult> {
  const result = await updateDecision(decisionId, { status });
  if (result.status === "success") revalidateNotes();
  return result;
}

export async function removeDecisionAction(decisionId: string): Promise<void> {
  await deleteDecision(decisionId);
  revalidateNotes();
}

export interface UploadDocumentFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function uploadDocumentFormAction(weddingId: string, _prevState: UploadDocumentFormState, formData: FormData): Promise<UploadDocumentFormState> {
  const title = formData.get("title");
  const file = formData.get("file");
  const relatedEntity = parseRelatedEntity(formData.get("relatedEntity"));

  if (!(file instanceof File) || file.size === 0) {
    return { status: "invalid", message: "Choose a file to upload." };
  }

  const result: DocumentMutationResult = await uploadDocument(weddingId, file, {
    title: typeof title === "string" ? title : "",
    ...relatedEntity,
  });

  if (result.status === "success") {
    revalidateNotes();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function removeDocumentAction(documentId: string): Promise<void> {
  await deleteDocument(documentId);
  revalidateNotes();
}

export async function getDocumentUrlAction(documentId: string): Promise<string | null> {
  return getDocumentSignedUrl(documentId);
}

"use server";

import { revalidatePath } from "next/cache";

import {
  deleteDocument,
  getDocumentSignedUrl,
  updateDocumentMetadata,
  uploadDocument,
  type DocumentMetadataInput,
  type DocumentMutationResult,
} from "@/lib/home-planner/documents";
import type { HomeDocumentCategory } from "@/types/home-planner";

/**
 * Documents' own Server Actions - thin wrappers around
 * `@/lib/home-planner/documents`, the same shape
 * `wedding-planner/notes/actions.ts` establishes for its own documents.
 */

const DOCUMENTS_PATH = "/app/home-planner/documents";

function revalidateDocuments() {
  revalidatePath(DOCUMENTS_PATH);
}

function parseRelatedEntity(value: FormDataEntryValue | null): { relatedEntityType?: "room" | "inventory_item"; relatedEntityId?: string } {
  if (typeof value !== "string" || !value) return {};
  const [type, id] = value.split(":");
  if ((type !== "room" && type !== "inventory_item") || !id) return {};
  return { relatedEntityType: type, relatedEntityId: id };
}

function readMetadataInput(formData: FormData): DocumentMetadataInput {
  const title = formData.get("title");
  const category = formData.get("category");
  const description = formData.get("description");
  const documentDate = formData.get("documentDate");
  const notes = formData.get("notes");
  const relatedEntity = parseRelatedEntity(formData.get("relatedEntity"));

  return {
    title: typeof title === "string" ? title : "",
    // Cast, not validated here - `uploadDocument`/`updateDocumentMetadata`'s
    // zod schema (`z.enum`) is the real validation.
    category: (typeof category === "string" ? category : "") as HomeDocumentCategory,
    description: typeof description === "string" ? description : undefined,
    documentDate: typeof documentDate === "string" ? documentDate : undefined,
    notes: typeof notes === "string" ? notes : undefined,
    ...relatedEntity,
  };
}

export interface UploadDocumentFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function uploadDocumentFormAction(
  homeId: string,
  _prevState: UploadDocumentFormState,
  formData: FormData,
): Promise<UploadDocumentFormState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "invalid", message: "Choose a file to upload." };
  }

  const result = await uploadDocument(homeId, file, readMetadataInput(formData));

  if (result.status === "success") {
    revalidateDocuments();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editDocumentMetadataAction(documentId: string, formData: FormData): Promise<DocumentMutationResult> {
  const result = await updateDocumentMetadata(documentId, readMetadataInput(formData));
  if (result.status === "success") {
    revalidateDocuments();
  }
  return result;
}

export async function removeDocumentAction(documentId: string): Promise<void> {
  await deleteDocument(documentId);
  revalidateDocuments();
}

export async function getDocumentUrlAction(documentId: string): Promise<string | null> {
  return getDocumentSignedUrl(documentId);
}

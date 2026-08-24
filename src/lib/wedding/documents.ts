import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RelatedEntityRef, RelatedEntityType, WeddingDocument } from "@/types/wedding";

/**
 * Wedding Planner documents - `public.wedding_documents` (metadata) +
 * the private `wedding-documents` Storage bucket (the actual file), both
 * from `20260830000000_wedding_notes_decisions_documents.sql`. Path
 * convention: `{owner_id}/{document_id}-{filename}` - the same "folder
 * per owner, checked against auth.uid()" pattern `avatars` established
 * (`@/lib/profile.ts`'s `updateAvatar`), except this bucket is private:
 * reading a document requires a signed URL (`getDocumentUrl` below), not
 * a permanent public one.
 */

const DOCUMENT_COLUMNS = "id, wedding_id, title, storage_path, file_type, file_size_bytes, related_entity_type, related_entity_id, created_at, updated_at";

type DocumentRow = {
  id: string;
  wedding_id: string;
  title: string;
  storage_path: string;
  file_type: string | null;
  file_size_bytes: number | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapRelatedEntity(type: string | null, id: string | null): RelatedEntityRef | null {
  if (!type || !id) return null;
  return { type: type as RelatedEntityType, id };
}

function mapDocumentRow(row: DocumentRow): WeddingDocument {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    title: row.title,
    storagePath: row.storage_path,
    fileType: row.file_type,
    fileSizeBytes: row.file_size_bytes,
    relatedEntity: mapRelatedEntity(row.related_entity_type, row.related_entity_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDocumentsForWedding(weddingId: string): Promise<WeddingDocument[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDocumentsForWedding: failed to load documents", error);
    return [];
  }

  return (data ?? []).map(mapDocumentRow);
}

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const relatedEntityTypeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));
const relatedEntityIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const uploadDocumentSchema = z.object({
  title: z.string().trim().min(1, "Give this document a title.").max(150, "Keep it under 150 characters."),
  relatedEntityType: relatedEntityTypeSchema,
  relatedEntityId: relatedEntityIdSchema,
});

export type UploadDocumentInput = z.input<typeof uploadDocumentSchema>;

export type DocumentMutationResult =
  | { status: "success"; document: WeddingDocument }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Uploads a file to the private `wedding-documents` bucket and records its
 * metadata - real validation before ever calling Storage (the same
 * discipline `updateAvatar` follows), never a fake "uploaded" state.
 */
export async function uploadDocument(weddingId: string, file: File, input: UploadDocumentInput): Promise<DocumentMutationResult> {
  const user = await requireUser();

  const parsed = uploadDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return { status: "invalid", message: "Upload a PDF, Word document, or image (PNG/JPEG/WebP)." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { status: "invalid", message: "Files must be 15MB or smaller." };
  }

  const relatedEntityType = parsed.data.relatedEntityId ? parsed.data.relatedEntityType : null;
  const relatedEntityId = parsed.data.relatedEntityType ? parsed.data.relatedEntityId : null;

  const supabase = await createSupabaseServerClient();

  const documentId = crypto.randomUUID();
  // Sanitized filename segment, kept short - the real title lives in
  // `wedding_documents.title`, this is only ever used as part of a
  // storage path, never displayed.
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80);
  const path = `${user.id}/${documentId}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("wedding-documents").upload(path, file, { contentType: file.type });

  if (uploadError) {
    console.error("uploadDocument: failed to upload file", uploadError);
    return { status: "error", message: "Couldn't upload that file. Please try again." };
  }

  const { data, error } = await supabase
    .from("wedding_documents")
    .insert({
      id: documentId,
      wedding_id: weddingId,
      title: parsed.data.title,
      storage_path: path,
      file_type: file.type,
      file_size_bytes: file.size,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
    })
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("uploadDocument: failed to save document metadata", error);
    // The file itself already uploaded - clean it up rather than leaving
    // an orphaned Storage object with no matching row.
    await supabase.storage.from("wedding-documents").remove([path]);
    return { status: "error", message: "Your file uploaded, but saving it failed. Please try again." };
  }

  return { status: "success", document: mapDocumentRow(data) };
}

/**
 * A short-lived signed URL for viewing/downloading a private document -
 * never a permanent public link. `documentId` is resolved through this
 * user's own RLS-scoped query first, so a signed URL is only ever issued
 * for a document this user actually owns.
 */
export async function getDocumentSignedUrl(documentId: string): Promise<string | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: document, error: fetchError } = await supabase.from("wedding_documents").select("storage_path").eq("id", documentId).maybeSingle();

  if (fetchError || !document) {
    console.error("getDocumentSignedUrl: failed to resolve document", fetchError);
    return null;
  }

  const { data, error } = await supabase.storage.from("wedding-documents").createSignedUrl(document.storage_path, 60);

  if (error || !data) {
    console.error("getDocumentSignedUrl: failed to sign URL", error);
    return null;
  }

  return data.signedUrl;
}

export type DeleteDocumentResult = { status: "success" } | { status: "error"; message: string };

export async function deleteDocument(documentId: string): Promise<DeleteDocumentResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: document, error: fetchError } = await supabase.from("wedding_documents").select("storage_path").eq("id", documentId).maybeSingle();

  if (fetchError || !document) {
    console.error("deleteDocument: failed to resolve document", fetchError);
    return { status: "error", message: "Couldn't remove that document. Please try again." };
  }

  const { error: deleteRowError } = await supabase.from("wedding_documents").delete().eq("id", documentId);
  if (deleteRowError) {
    console.error("deleteDocument: failed to delete document row", deleteRowError);
    return { status: "error", message: "Couldn't remove that document. Please try again." };
  }

  // Best-effort - the row is already gone (the part RLS and every other
  // reader cares about); a lingering Storage object with no matching row
  // is harmless clutter, not a correctness issue.
  await supabase.storage.from("wedding-documents").remove([document.storage_path]);

  return { status: "success" };
}

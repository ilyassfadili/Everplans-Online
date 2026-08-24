import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HomeDocument, HomeDocumentCategory, HomeRelatedEntityRef, HomeRelatedEntityType } from "@/types/home-planner";

/**
 * Home Planner documents - `public.home_documents` (metadata) + the
 * private `home-documents` Storage bucket (the actual file), both from
 * `20260910000008_home_documents.sql`. Same shape as
 * `@/lib/wedding/documents` - the reuse Phase 2's own instruction asks
 * for, applied to Home Planner's own bucket/table rather than a parallel
 * architecture.
 */

const DOCUMENT_COLUMNS =
  "id, home_id, title, category, description, document_date, storage_path, file_type, file_size_bytes, related_entity_type, related_entity_id, notes, created_at, updated_at";

const CATEGORIES = [
  "property",
  "rental",
  "insurance",
  "warranty",
  "receipt",
  "manual",
  "record",
  "other",
] as const satisfies readonly HomeDocumentCategory[];

const RELATED_ENTITY_TYPES = ["room", "inventory_item"] as const satisfies readonly HomeRelatedEntityType[];

type DocumentRow = {
  id: string;
  home_id: string;
  title: string;
  category: string;
  description: string | null;
  document_date: string | null;
  storage_path: string;
  file_type: string | null;
  file_size_bytes: number | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapRelatedEntity(type: string | null, id: string | null): HomeRelatedEntityRef | null {
  if (!type || !id) return null;
  return { type: type as HomeRelatedEntityType, id };
}

function mapDocumentRow(row: DocumentRow): HomeDocument {
  return {
    id: row.id,
    homeId: row.home_id,
    title: row.title,
    // Cast, not re-validated: `home_documents_category_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    category: row.category as HomeDocumentCategory,
    description: row.description,
    documentDate: row.document_date,
    storagePath: row.storage_path,
    fileType: row.file_type,
    fileSizeBytes: row.file_size_bytes,
    relatedEntity: mapRelatedEntity(row.related_entity_type, row.related_entity_id),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDocumentsForHome(homeId: string): Promise<HomeDocument[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("home_id", homeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDocumentsForHome: failed to load documents", error);
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

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const relatedEntityTypeSchema = z
  .union([z.enum(RELATED_ENTITY_TYPES), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));
const relatedEntityIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const documentMetadataSchema = z.object({
  title: z.string().trim().min(1, "Give this document a title.").max(150, "Keep it under 150 characters."),
  category: z.enum(CATEGORIES, { message: "Choose a category." }),
  description: optionalTextSchema(1000, "Keep it under 1000 characters."),
  documentDate: optionalTextSchema(10, "Enter a valid date."),
  relatedEntityType: relatedEntityTypeSchema,
  relatedEntityId: relatedEntityIdSchema,
  notes: optionalTextSchema(2000, "Keep it under 2000 characters."),
});

export type DocumentMetadataInput = z.input<typeof documentMetadataSchema>;

export type DocumentMutationResult =
  | { status: "success"; document: HomeDocument }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Uploads a file to the private `home-documents` bucket and records its
 * metadata - real validation before ever calling Storage (the same
 * discipline `@/lib/wedding/documents`'s `uploadDocument` follows), never
 * a fake "uploaded" state.
 */
export async function uploadDocument(homeId: string, file: File, input: DocumentMetadataInput): Promise<DocumentMutationResult> {
  const user = await requireUser();

  const parsed = documentMetadataSchema.safeParse(input);
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
  // `home_documents.title`, this is only ever used as part of a storage
  // path, never displayed.
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80);
  const path = `${user.id}/${documentId}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("home-documents").upload(path, file, { contentType: file.type });

  if (uploadError) {
    console.error("uploadDocument: failed to upload file", uploadError);
    return { status: "error", message: "Couldn't upload that file. Please try again." };
  }

  const { data, error } = await supabase
    .from("home_documents")
    .insert({
      id: documentId,
      home_id: homeId,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      document_date: parsed.data.documentDate,
      storage_path: path,
      file_type: file.type,
      file_size_bytes: file.size,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      notes: parsed.data.notes,
    })
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("uploadDocument: failed to save document metadata", error);
    // The file itself already uploaded - clean it up rather than leaving
    // an orphaned Storage object with no matching row.
    await supabase.storage.from("home-documents").remove([path]);
    return { status: "error", message: "Your file uploaded, but saving it failed. Please try again." };
  }

  return { status: "success", document: mapDocumentRow(data) };
}

/** Renames/recategorizes a document without touching the underlying file (Phase 2: "rename/edit metadata"). */
export async function updateDocumentMetadata(documentId: string, input: DocumentMetadataInput): Promise<DocumentMutationResult> {
  await requireUser();

  const parsed = documentMetadataSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const relatedEntityType = parsed.data.relatedEntityId ? parsed.data.relatedEntityType : null;
  const relatedEntityId = parsed.data.relatedEntityType ? parsed.data.relatedEntityId : null;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_documents")
    .update({
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      document_date: parsed.data.documentDate,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      notes: parsed.data.notes,
    })
    .eq("id", documentId)
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateDocumentMetadata: failed to update document", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
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

  const { data: document, error: fetchError } = await supabase.from("home_documents").select("storage_path").eq("id", documentId).maybeSingle();

  if (fetchError || !document) {
    console.error("getDocumentSignedUrl: failed to resolve document", fetchError);
    return null;
  }

  const { data, error } = await supabase.storage.from("home-documents").createSignedUrl(document.storage_path, 60);

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

  const { data: document, error: fetchError } = await supabase.from("home_documents").select("storage_path").eq("id", documentId).maybeSingle();

  if (fetchError || !document) {
    console.error("deleteDocument: failed to resolve document", fetchError);
    return { status: "error", message: "Couldn't remove that document. Please try again." };
  }

  const { error: deleteRowError } = await supabase.from("home_documents").delete().eq("id", documentId);
  if (deleteRowError) {
    console.error("deleteDocument: failed to delete document row", deleteRowError);
    return { status: "error", message: "Couldn't remove that document. Please try again." };
  }

  // Best-effort - the row is already gone (the part RLS and every other
  // reader cares about); a lingering Storage object with no matching row
  // is harmless clutter, not a correctness issue.
  await supabase.storage.from("home-documents").remove([document.storage_path]);

  return { status: "success" };
}

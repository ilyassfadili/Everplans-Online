import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RelatedEntityRef, RelatedEntityType, WeddingNote } from "@/types/wedding";

/**
 * Wedding Planner notes - `public.wedding_notes`
 * (`supabase/migrations/20260830000000_wedding_notes_decisions_documents.sql`).
 * `related_entity_type`/`related_entity_id` are a soft reference (see the
 * migration's own comment) - `relatedEntity` is `null` unless both are
 * set, never a half-formed reference.
 */

const NOTE_COLUMNS = "id, wedding_id, title, content, related_entity_type, related_entity_id, created_at, updated_at";

type NoteRow = {
  id: string;
  wedding_id: string;
  title: string;
  content: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapRelatedEntity(type: string | null, id: string | null): RelatedEntityRef | null {
  if (!type || !id) return null;
  return { type: type as RelatedEntityType, id };
}

function mapNoteRow(row: NoteRow): WeddingNote {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    title: row.title,
    content: row.content,
    relatedEntity: mapRelatedEntity(row.related_entity_type, row.related_entity_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getNotesForWedding(weddingId: string): Promise<WeddingNote[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_notes")
    .select(NOTE_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getNotesForWedding: failed to load notes", error);
    return [];
  }

  return (data ?? []).map(mapNoteRow);
}

// A blank string means "no relation" - the create/edit forms encode that
// choice as an empty option value, so both must resolve to `null` the
// same way, never a `related_entity_type` with no matching id.
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

const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Give this note a title.").max(150, "Keep it under 150 characters."),
  content: z.string().trim().max(5000, "Keep it under 5000 characters.").optional().default(""),
  relatedEntityType: relatedEntityTypeSchema,
  relatedEntityId: relatedEntityIdSchema,
});

export type CreateNoteInput = z.input<typeof createNoteSchema>;

export type NoteMutationResult =
  | { status: "success"; note: WeddingNote }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createNote(weddingId: string, input: CreateNoteInput): Promise<NoteMutationResult> {
  await requireUser();

  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  // Both columns null or both set (the migration's own constraint) - a
  // type chosen with no id (shouldn't happen from the UI, but defensive)
  // is treated as "no relation" rather than risking a constraint
  // violation on a genuinely accidental half-formed value.
  const relatedEntityType = parsed.data.relatedEntityId ? parsed.data.relatedEntityType : null;
  const relatedEntityId = parsed.data.relatedEntityType ? parsed.data.relatedEntityId : null;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_notes")
    .insert({
      wedding_id: weddingId,
      title: parsed.data.title,
      content: parsed.data.content,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
    })
    .select(NOTE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createNote: failed to create note", error);
    return { status: "error", message: "Couldn't add that note. Please try again." };
  }

  return { status: "success", note: mapNoteRow(data) };
}

export type DeleteNoteResult = { status: "success" } | { status: "error"; message: string };

export async function deleteNote(noteId: string): Promise<DeleteNoteResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_notes").delete().eq("id", noteId);

  if (error) {
    console.error("deleteNote: failed to delete note", error);
    return { status: "error", message: "Couldn't remove that note. Please try again." };
  }

  return { status: "success" };
}

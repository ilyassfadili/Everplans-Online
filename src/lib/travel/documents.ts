import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TravelDocument, TravelDocumentStatus, TravelDocumentType } from "@/types/travel";

/**
 * Travel Planner document checklist (Prompt 4 Phase 2) - `public.trip_documents`.
 * A CHECKLIST/STATUS record, not a secure vault (the migration's own
 * security note) - no file is ever attached here. Same shape as
 * `@/lib/travel/bookings`: every function calls `requireUser()` itself,
 * and RLS (a join back to `trips.owner_id`) independently enforces "only
 * this trip's owner."
 */

const DOCUMENT_COLUMNS = "id, trip_id, document_type, name, status, expiry_date, notes, created_at, updated_at";

const DOCUMENT_TYPES = [
  "passport",
  "visa",
  "insurance",
  "id",
  "tickets",
  "booking-confirmation",
  "other",
] as const satisfies readonly TravelDocumentType[];

const DOCUMENT_STATUSES = ["needed", "ready", "expired", "not-required"] as const satisfies readonly TravelDocumentStatus[];

type DocumentRow = {
  id: string;
  trip_id: string;
  document_type: string;
  name: string;
  status: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapDocumentRow(row: DocumentRow): TravelDocument {
  return {
    id: row.id,
    tripId: row.trip_id,
    documentType: row.document_type as TravelDocumentType,
    name: row.name,
    status: row.status as TravelDocumentStatus,
    expiryDate: row.expiry_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDocumentsForTrip(tripId: string): Promise<TravelDocument[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getDocumentsForTrip: failed to load documents", error);
    return [];
  }

  return (data ?? []).map(mapDocumentRow);
}

const documentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, { message: "Choose a document type." }),
  name: z.string().trim().min(1, "Give this document a name.").max(150, "Keep it under 150 characters."),
  status: z.enum(DOCUMENT_STATUSES, { message: "Choose a status." }),
  expiryDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  notes: z
    .string()
    .trim()
    .max(500, "Keep it under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type TravelDocumentInput = z.input<typeof documentSchema>;

export type TravelDocumentMutationResult =
  | { status: "success"; document: TravelDocument }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createTravelDocument(tripId: string, input: TravelDocumentInput): Promise<TravelDocumentMutationResult> {
  await requireUser();

  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_documents")
    .insert({
      trip_id: tripId,
      document_type: parsed.data.documentType,
      name: parsed.data.name,
      status: parsed.data.status,
      expiry_date: parsed.data.expiryDate,
      notes: parsed.data.notes,
    })
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createTravelDocument: failed to create document", error);
    return { status: "error", message: "Couldn't add that document. Please try again." };
  }

  return { status: "success", document: mapDocumentRow(data) };
}

export async function updateTravelDocument(documentId: string, input: TravelDocumentInput): Promise<TravelDocumentMutationResult> {
  await requireUser();

  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_documents")
    .update({
      document_type: parsed.data.documentType,
      name: parsed.data.name,
      status: parsed.data.status,
      expiry_date: parsed.data.expiryDate,
      notes: parsed.data.notes,
    })
    .eq("id", documentId)
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateTravelDocument: failed to update document", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", document: mapDocumentRow(data) };
}

export type DeleteTravelDocumentResult = { status: "success" } | { status: "error"; message: string };

export async function deleteTravelDocument(documentId: string): Promise<DeleteTravelDocumentResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("trip_documents").delete().eq("id", documentId);

  if (error) {
    console.error("deleteTravelDocument: failed to delete document", error);
    return { status: "error", message: "Couldn't remove that document. Please try again." };
  }

  return { status: "success" };
}

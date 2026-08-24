import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeddingImportantDate } from "@/types/wedding";

/**
 * Wedding Planner important dates - `public.wedding_important_dates`
 * (`supabase/migrations/20260825000000_wedding_timeline.sql`). Same shape
 * as `@/lib/wedding/milestones`: every function calls `requireUser()`
 * itself, and RLS (a join back to `weddings.owner_id`) independently
 * enforces the same "only this wedding's owner" boundary.
 */

const DATE_COLUMNS = "id, wedding_id, title, description, event_date, event_time, created_at, updated_at";

type ImportantDateRow = {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  created_at: string;
  updated_at: string;
};

function mapImportantDateRow(row: ImportantDateRow): WeddingImportantDate {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    // Postgres returns `time` as `HH:MM:SS` - trimmed to `HH:MM` to match
    // exactly what an `<input type="time">` both renders and submits.
    eventTime: row.event_time ? row.event_time.slice(0, 5) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** All of a wedding's user-created important dates, chronological - the wedding date itself is merged in separately by `@/lib/wedding/timeline`. */
export async function getImportantDatesForWedding(weddingId: string): Promise<WeddingImportantDate[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_important_dates")
    .select(DATE_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("getImportantDatesForWedding: failed to load important dates", error);
    return [];
  }

  return (data ?? []).map(mapImportantDateRow);
}

const dateFieldsSchema = {
  title: z.string().trim().min(1, "Give this date a title.").max(150, "Keep it under 150 characters."),
  eventDate: z.string().trim().min(1, "Choose a date."),
  eventTime: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
};

const createImportantDateSchema = z.object({
  title: dateFieldsSchema.title,
  eventDate: dateFieldsSchema.eventDate,
  eventTime: dateFieldsSchema.eventTime,
});

export type CreateImportantDateInput = z.input<typeof createImportantDateSchema>;

export type ImportantDateMutationResult =
  | { status: "success"; date: WeddingImportantDate }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Adds an important date - the checklist's own "quick, minimal-field creation" pattern applied to dates. */
export async function createImportantDate(
  weddingId: string,
  input: CreateImportantDateInput,
): Promise<ImportantDateMutationResult> {
  await requireUser();

  const parsed = createImportantDateSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_important_dates")
    .insert({
      wedding_id: weddingId,
      title: parsed.data.title,
      event_date: parsed.data.eventDate,
      event_time: parsed.data.eventTime,
    })
    .select(DATE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createImportantDate: failed to create important date", error);
    return { status: "error", message: "Couldn't add that date. Please try again." };
  }

  return { status: "success", date: mapImportantDateRow(data) };
}

const updateImportantDateSchema = z.object({
  title: dateFieldsSchema.title.optional(),
  eventDate: dateFieldsSchema.eventDate.optional(),
  eventTime: dateFieldsSchema.eventTime,
});

export type UpdateImportantDateInput = z.input<typeof updateImportantDateSchema>;

/** Edits an important date - only the fields actually present in `input` are written, the same partial-patch approach `updateTask` uses. */
export async function updateImportantDate(
  dateId: string,
  input: UpdateImportantDateInput,
): Promise<ImportantDateMutationResult> {
  await requireUser();

  const parsed = updateImportantDateSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { title?: string; event_date?: string; event_time?: string | null } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.eventDate !== undefined) patch.event_date = parsed.data.eventDate;
  // `eventTime` uses `.optional().transform(v => v ? v : null)` - the
  // transform runs even when the field is absent, so checking presence on
  // the raw `input` (not the parsed output) is what makes "leave the time
  // alone" and "clear the time" distinguishable - see `updateTask`'s own
  // identical fix for the full explanation.
  if (Object.hasOwn(input, "eventTime")) patch.event_time = parsed.data.eventTime;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_important_dates")
    .update(patch)
    .eq("id", dateId)
    .select(DATE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateImportantDate: failed to update important date", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", date: mapImportantDateRow(data) };
}

export type DeleteImportantDateResult = { status: "success" } | { status: "error"; message: string };

export async function deleteImportantDate(dateId: string): Promise<DeleteImportantDateResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_important_dates").delete().eq("id", dateId);

  if (error) {
    console.error("deleteImportantDate: failed to delete important date", error);
    return { status: "error", message: "Couldn't remove that date. Please try again." };
  }

  return { status: "success" };
}

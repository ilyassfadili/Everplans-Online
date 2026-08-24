import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeddingGuest, WeddingGuestRsvpStatus } from "@/types/wedding";

/**
 * Wedding Planner guests - `public.wedding_guests`
 * (`supabase/migrations/20260827000000_wedding_guests.sql`). Same shape as
 * every other Wedding Planner entity: every function calls `requireUser()`
 * itself, and RLS (a join back to `weddings.owner_id`) independently
 * enforces the same "only this wedding's owner" boundary.
 */

const GUEST_COLUMNS = "id, wedding_id, first_name, last_name, email, phone, group_label, rsvp_status, created_at, updated_at";

type GuestRow = {
  id: string;
  wedding_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  group_label: string | null;
  rsvp_status: string;
  created_at: string;
  updated_at: string;
};

function mapGuestRow(row: GuestRow): WeddingGuest {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    groupLabel: row.group_label,
    // Cast, not re-validated: `wedding_guests_rsvp_status_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    rsvpStatus: row.rsvp_status as WeddingGuestRsvpStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getGuestsForWedding(weddingId: string): Promise<WeddingGuest[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_guests")
    .select(GUEST_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    console.error("getGuestsForWedding: failed to load guests", error);
    return [];
  }

  return (data ?? []).map(mapGuestRow);
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const createGuestSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name.").max(100, "Keep it under 100 characters."),
  lastName: z.string().trim().min(1, "Enter a last name.").max(100, "Keep it under 100 characters."),
  groupLabel: optionalTextSchema(100, "Keep it under 100 characters."),
});

export type CreateGuestInput = z.input<typeof createGuestSchema>;

export type GuestMutationResult =
  | { status: "success"; guest: WeddingGuest }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Quick guest creation (Phase 1: "do not create a spreadsheet-like experience") - name and an optional group, everything else (email, phone, RSVP) added via editing. */
export async function createGuest(weddingId: string, input: CreateGuestInput): Promise<GuestMutationResult> {
  await requireUser();

  const parsed = createGuestSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_guests")
    .insert({ wedding_id: weddingId, first_name: parsed.data.firstName, last_name: parsed.data.lastName, group_label: parsed.data.groupLabel })
    .select(GUEST_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createGuest: failed to create guest", error);
    return { status: "error", message: "Couldn't add that guest. Please try again." };
  }

  return { status: "success", guest: mapGuestRow(data) };
}

const updateGuestSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name.").max(100, "Keep it under 100 characters.").optional(),
  lastName: z.string().trim().min(1, "Enter a last name.").max(100, "Keep it under 100 characters.").optional(),
  email: optionalTextSchema(254, "Keep it under 254 characters."),
  phone: optionalTextSchema(32, "Keep it under 32 characters."),
  groupLabel: optionalTextSchema(100, "Keep it under 100 characters."),
  rsvpStatus: z.enum(["not-responded", "attending", "not-attending"]).optional(),
});

export type UpdateGuestInput = z.input<typeof updateGuestSchema>;

/**
 * Edits a guest - only the fields actually present in `input` are
 * written. `email`/`phone`/`groupLabel` all use `.optional().transform(...)`,
 * so presence is checked against the raw `input`, not the parsed output -
 * see `updateTask`'s own comment (`@/lib/wedding/tasks`) for the full
 * explanation of why that distinction matters.
 */
export async function updateGuest(guestId: string, input: UpdateGuestInput): Promise<GuestMutationResult> {
  await requireUser();

  const parsed = updateGuestSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    first_name?: string;
    last_name?: string;
    email?: string | null;
    phone?: string | null;
    group_label?: string | null;
    rsvp_status?: string;
  } = {};

  if (parsed.data.firstName !== undefined) patch.first_name = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) patch.last_name = parsed.data.lastName;
  if (parsed.data.rsvpStatus !== undefined) patch.rsvp_status = parsed.data.rsvpStatus;
  if (Object.hasOwn(input, "email")) patch.email = parsed.data.email;
  if (Object.hasOwn(input, "phone")) patch.phone = parsed.data.phone;
  if (Object.hasOwn(input, "groupLabel")) patch.group_label = parsed.data.groupLabel;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_guests").update(patch).eq("id", guestId).select(GUEST_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateGuest: failed to update guest", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", guest: mapGuestRow(data) };
}

export type DeleteGuestResult = { status: "success" } | { status: "error"; message: string };

export async function deleteGuest(guestId: string): Promise<DeleteGuestResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_guests").delete().eq("id", guestId);

  if (error) {
    console.error("deleteGuest: failed to delete guest", error);
    return { status: "error", message: "Couldn't remove that guest. Please try again." };
  }

  return { status: "success" };
}

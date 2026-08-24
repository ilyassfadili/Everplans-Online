import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeddingVenue } from "@/types/wedding";

/** Wedding Planner venues - `public.wedding_venues` (`supabase/migrations/20260829000000_wedding_venues_and_events.sql`). Same shape as every other Wedding Planner entity. */

const VENUE_COLUMNS = "id, wedding_id, name, address, contact_phone, contact_email, website, notes, created_at, updated_at";

type VenueRow = {
  id: string;
  wedding_id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapVenueRow(row: VenueRow): WeddingVenue {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    name: row.name,
    address: row.address,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    website: row.website,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getVenuesForWedding(weddingId: string): Promise<WeddingVenue[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_venues").select(VENUE_COLUMNS).eq("wedding_id", weddingId).order("name", { ascending: true });

  if (error) {
    console.error("getVenuesForWedding: failed to load venues", error);
    return [];
  }

  return (data ?? []).map(mapVenueRow);
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const createVenueSchema = z.object({
  name: z.string().trim().min(1, "Give this venue a name.").max(150, "Keep it under 150 characters."),
  address: optionalTextSchema(300, "Keep it under 300 characters."),
});

export type CreateVenueInput = z.input<typeof createVenueSchema>;

export type VenueMutationResult =
  | { status: "success"; venue: WeddingVenue }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Lightweight venue creation - name and an optional address, everything else added via editing. */
export async function createVenue(weddingId: string, input: CreateVenueInput): Promise<VenueMutationResult> {
  await requireUser();

  const parsed = createVenueSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_venues")
    .insert({ wedding_id: weddingId, name: parsed.data.name, address: parsed.data.address })
    .select(VENUE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createVenue: failed to create venue", error);
    return { status: "error", message: "Couldn't add that venue. Please try again." };
  }

  return { status: "success", venue: mapVenueRow(data) };
}

const updateVenueSchema = z.object({
  name: z.string().trim().min(1, "Give this venue a name.").max(150, "Keep it under 150 characters.").optional(),
  address: optionalTextSchema(300, "Keep it under 300 characters."),
  contactPhone: optionalTextSchema(32, "Keep it under 32 characters."),
  contactEmail: optionalTextSchema(254, "Keep it under 254 characters."),
  website: optionalTextSchema(300, "Keep it under 300 characters."),
  notes: optionalTextSchema(1000, "Keep notes under 1000 characters."),
});

export type UpdateVenueInput = z.input<typeof updateVenueSchema>;

/** Edits a venue - only the fields actually present in `input` are written, checked against the raw `input` (see `updateTask`'s own comment for why). */
export async function updateVenue(venueId: string, input: UpdateVenueInput): Promise<VenueMutationResult> {
  await requireUser();

  const parsed = updateVenueSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    address?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    website?: string | null;
    notes?: string | null;
  } = {};

  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (Object.hasOwn(input, "address")) patch.address = parsed.data.address;
  if (Object.hasOwn(input, "contactPhone")) patch.contact_phone = parsed.data.contactPhone;
  if (Object.hasOwn(input, "contactEmail")) patch.contact_email = parsed.data.contactEmail;
  if (Object.hasOwn(input, "website")) patch.website = parsed.data.website;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_venues").update(patch).eq("id", venueId).select(VENUE_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateVenue: failed to update venue", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", venue: mapVenueRow(data) };
}

export type DeleteVenueResult = { status: "success" } | { status: "error"; message: string };

/** Deletes a venue. Events that referenced it are NOT deleted - `wedding_events.venue_id` is `on delete set null`, so they simply lose their venue link. */
export async function deleteVenue(venueId: string): Promise<DeleteVenueResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_venues").delete().eq("id", venueId);

  if (error) {
    console.error("deleteVenue: failed to delete venue", error);
    return { status: "error", message: "Couldn't remove that venue. Please try again." };
  }

  return { status: "success" };
}

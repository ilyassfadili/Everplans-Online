import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmergencyContact } from "@/types/travel";

/**
 * Emergency contacts (Prompt 4 Phase 3) - `public.trip_emergency_contacts`,
 * the one genuinely new data model this phase introduces (the migration's
 * own comment). Same shape as `@/lib/travel/bookings`: every function
 * calls `requireUser()` itself, and RLS (a join back to `trips.owner_id`)
 * independently enforces "only this trip's owner."
 */

const CONTACT_COLUMNS = "id, trip_id, name, relationship, phone, email, notes, sort_order, created_at, updated_at";

type ContactRow = {
  id: string;
  trip_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapContactRow(row: ContactRow): EmergencyContact {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    relationship: row.relationship,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getEmergencyContactsForTrip(tripId: string): Promise<EmergencyContact[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_emergency_contacts")
    .select(CONTACT_COLUMNS)
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getEmergencyContactsForTrip: failed to load emergency contacts", error);
    return [];
  }

  return (data ?? []).map(mapContactRow);
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(150, "Keep it under 150 characters."),
  relationship: z.string().trim().min(1, "Enter a relationship.").max(100, "Keep it under 100 characters."),
  phone: z.string().trim().min(1, "Enter a phone number.").max(50, "Keep it under 50 characters."),
  email: z
    .string()
    .trim()
    .max(254, "Keep it under 254 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  notes: z
    .string()
    .trim()
    .max(500, "Keep it under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type EmergencyContactInput = z.input<typeof contactSchema>;

export type EmergencyContactMutationResult =
  | { status: "success"; contact: EmergencyContact }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createEmergencyContact(tripId: string, input: EmergencyContactInput): Promise<EmergencyContactMutationResult> {
  await requireUser();

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase.from("trip_emergency_contacts").select("id", { count: "exact", head: true }).eq("trip_id", tripId);

  const { data, error } = await supabase
    .from("trip_emergency_contacts")
    .insert({
      trip_id: tripId,
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
      sort_order: count ?? 0,
    })
    .select(CONTACT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createEmergencyContact: failed to create emergency contact", error);
    return { status: "error", message: "Couldn't add that contact. Please try again." };
  }

  return { status: "success", contact: mapContactRow(data) };
}

export async function updateEmergencyContact(contactId: string, input: EmergencyContactInput): Promise<EmergencyContactMutationResult> {
  await requireUser();

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_emergency_contacts")
    .update({
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
    })
    .eq("id", contactId)
    .select(CONTACT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateEmergencyContact: failed to update emergency contact", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", contact: mapContactRow(data) };
}

export type DeleteEmergencyContactResult = { status: "success" } | { status: "error"; message: string };

export async function deleteEmergencyContact(contactId: string): Promise<DeleteEmergencyContactResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("trip_emergency_contacts").delete().eq("id", contactId);

  if (error) {
    console.error("deleteEmergencyContact: failed to delete emergency contact", error);
    return { status: "error", message: "Couldn't remove that contact. Please try again." };
  }

  return { status: "success" };
}

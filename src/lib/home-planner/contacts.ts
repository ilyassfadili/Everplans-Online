import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HomeContact, HomeContactRole } from "@/types/home-planner";

/**
 * Home Planner important contacts - `public.home_contacts`
 * (`supabase/migrations/20260910000001_home_planner_contacts.sql`). Same
 * shape as `@/lib/home-planner/household-members` and `@/lib/wedding/guests`:
 * every function calls `requireUser()` itself, and RLS (a join back to
 * `homes.owner_id`) independently enforces the same "only this home's
 * owner" boundary.
 */

const CONTACT_COLUMNS = "id, home_id, name, role, phone, email, notes, created_at, updated_at";

const CONTACT_ROLES = [
  "property-manager",
  "landlord",
  "contractor",
  "emergency-contact",
  "service-provider",
  "other",
] as const satisfies readonly HomeContactRole[];

type ContactRow = {
  id: string;
  home_id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapContactRow(row: ContactRow): HomeContact {
  return {
    id: row.id,
    homeId: row.home_id,
    name: row.name,
    // Cast, not re-validated: `home_contacts_role_valid` (the migration)
    // already guarantees the database can never hold anything outside this
    // union.
    role: row.role as HomeContactRole,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getContactsForHome(homeId: string): Promise<HomeContact[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_contacts")
    .select(CONTACT_COLUMNS)
    .eq("home_id", homeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getContactsForHome: failed to load home contacts", error);
    return [];
  }

  return (data ?? []).map(mapContactRow);
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const createContactSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(150, "Keep it under 150 characters."),
  role: z.enum(CONTACT_ROLES, { message: "Choose a role." }),
  phone: optionalTextSchema(32, "Keep it under 32 characters."),
  email: optionalTextSchema(254, "Keep it under 254 characters."),
  notes: optionalTextSchema(1000, "Keep it under 1000 characters."),
});

export type CreateHomeContactInput = z.input<typeof createContactSchema>;

export type HomeContactMutationResult =
  | { status: "success"; contact: HomeContact }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Important contact creation (Phase 2: "keep the experience simple") - name, role, and optional phone/email/notes. */
export async function createContact(homeId: string, input: CreateHomeContactInput): Promise<HomeContactMutationResult> {
  await requireUser();

  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_contacts")
    .insert({
      home_id: homeId,
      name: parsed.data.name,
      role: parsed.data.role,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
    })
    .select(CONTACT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createContact: failed to create home contact", error);
    return { status: "error", message: "Couldn't add that contact. Please try again." };
  }

  return { status: "success", contact: mapContactRow(data) };
}

const updateContactSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(150, "Keep it under 150 characters.").optional(),
  role: z.enum(CONTACT_ROLES, { message: "Choose a role." }).optional(),
  phone: optionalTextSchema(32, "Keep it under 32 characters."),
  email: optionalTextSchema(254, "Keep it under 254 characters."),
  notes: optionalTextSchema(1000, "Keep it under 1000 characters."),
});

export type UpdateHomeContactInput = z.input<typeof updateContactSchema>;

/**
 * Edits a contact - only the fields actually present in `input` are
 * written, the same "presence checked against raw input" convention
 * `updateGuest` establishes (`@/lib/wedding/guests`'s own comment).
 */
export async function updateContact(contactId: string, input: UpdateHomeContactInput): Promise<HomeContactMutationResult> {
  await requireUser();

  const parsed = updateContactSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; role?: string; phone?: string | null; email?: string | null; notes?: string | null } = {};

  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.role !== undefined) patch.role = parsed.data.role;
  if (Object.hasOwn(input, "phone")) patch.phone = parsed.data.phone;
  if (Object.hasOwn(input, "email")) patch.email = parsed.data.email;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("home_contacts").update(patch).eq("id", contactId).select(CONTACT_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateContact: failed to update home contact", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", contact: mapContactRow(data) };
}

export type DeleteHomeContactResult = { status: "success" } | { status: "error"; message: string };

export async function deleteContact(contactId: string): Promise<DeleteHomeContactResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("home_contacts").delete().eq("id", contactId);

  if (error) {
    console.error("deleteContact: failed to delete home contact", error);
    return { status: "error", message: "Couldn't remove that contact. Please try again." };
  }

  return { status: "success" };
}

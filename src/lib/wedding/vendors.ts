import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAmountToCents } from "@/lib/wedding/currency";
import type { WeddingVendor, WeddingVendorStatus } from "@/types/wedding";

/**
 * Wedding Planner vendors - `public.wedding_vendors`, created minimal in
 * `20260826000000_wedding_budget.sql` (Prompt 3: name only, the foundation
 * for linking an expense to who it went to) and extended into the
 * canonical vendor record here (`20260828000000_wedding_vendor_details.sql`,
 * Prompt 4 Phase 3) - the same table throughout, never a second one.
 */

const VENDOR_COLUMNS =
  "id, wedding_id, name, category, contact_name, email, phone, website, notes, planned_amount_cents, status, created_at, updated_at";

type VendorRow = {
  id: string;
  wedding_id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  planned_amount_cents: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapVendorRow(row: VendorRow): WeddingVendor {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    name: row.name,
    category: row.category,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    notes: row.notes,
    plannedAmountCents: row.planned_amount_cents,
    // Cast, not re-validated: `wedding_vendors_status_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    status: row.status as WeddingVendorStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getVendorsForWedding(weddingId: string): Promise<WeddingVendor[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_vendors")
    .select(VENDOR_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("name", { ascending: true });

  if (error) {
    console.error("getVendorsForWedding: failed to load vendors", error);
    return [];
  }

  return (data ?? []).map(mapVendorRow);
}

/** One vendor by id - the detail page's own fetch. `null` if it doesn't exist or (via RLS) doesn't belong to the current user. */
export async function getVendorById(vendorId: string): Promise<WeddingVendor | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_vendors").select(VENDOR_COLUMNS).eq("id", vendorId).maybeSingle();

  if (error) {
    console.error("getVendorById: failed to load vendor", error);
    return null;
  }

  return data ? mapVendorRow(data) : null;
}

/**
 * Finds an existing vendor by name (case-insensitive) or creates one -
 * what the expense form's plain "Vendor" text field calls, so typing the
 * same vendor's name twice links to the same real vendor row rather than
 * creating a duplicate (`wedding_vendors_wedding_id_name_key`, the
 * migration's own unique index, is the database-level backstop for the
 * same guarantee).
 */
export async function findOrCreateVendorByName(weddingId: string, rawName: string): Promise<WeddingVendor | null> {
  const name = rawName.trim();
  if (!name) return null;

  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: findError } = await supabase
    .from("wedding_vendors")
    .select(VENDOR_COLUMNS)
    .eq("wedding_id", weddingId)
    .ilike("name", name)
    .maybeSingle();

  if (findError) {
    console.error("findOrCreateVendorByName: failed to look up vendor", findError);
    return null;
  }
  if (existing) {
    return mapVendorRow(existing);
  }

  const { data: created, error: createError } = await supabase
    .from("wedding_vendors")
    .insert({ wedding_id: weddingId, name })
    .select(VENDOR_COLUMNS)
    .maybeSingle();

  if (createError) {
    // A concurrent request already created this exact name (the unique
    // index rejected the insert as a duplicate) - re-fetch rather than
    // treating a benign race as a real failure.
    if (createError.code === "23505") {
      const { data: retried } = await supabase
        .from("wedding_vendors")
        .select(VENDOR_COLUMNS)
        .eq("wedding_id", weddingId)
        .ilike("name", name)
        .maybeSingle();
      return retried ? mapVendorRow(retried) : null;
    }

    console.error("findOrCreateVendorByName: failed to create vendor", createError);
    return null;
  }

  return created ? mapVendorRow(created) : null;
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const plannedAmountSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? parseAmountToCents(value) : null))
  .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative.").nullable());

const createVendorSchema = z.object({
  name: z.string().trim().min(1, "Give this vendor a name.").max(150, "Keep it under 150 characters."),
  category: optionalTextSchema(100, "Keep it under 100 characters."),
});

export type CreateVendorInput = z.input<typeof createVendorSchema>;

export type VendorMutationResult =
  | { status: "success"; vendor: WeddingVendor }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Lightweight vendor creation (Phase 4: "only essential information should be required") - name and an optional category, everything else added later via editing. */
export async function createVendor(weddingId: string, input: CreateVendorInput): Promise<VendorMutationResult> {
  await requireUser();

  const parsed = createVendorSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_vendors")
    .insert({ wedding_id: weddingId, name: parsed.data.name, category: parsed.data.category })
    .select(VENDOR_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { status: "invalid", message: "You already have a vendor with that name." };
    }
    console.error("createVendor: failed to create vendor", error);
    return { status: "error", message: "Couldn't add that vendor. Please try again." };
  }
  if (!data) {
    return { status: "error", message: "Couldn't add that vendor. Please try again." };
  }

  return { status: "success", vendor: mapVendorRow(data) };
}

const updateVendorSchema = z.object({
  name: z.string().trim().min(1, "Give this vendor a name.").max(150, "Keep it under 150 characters.").optional(),
  category: optionalTextSchema(100, "Keep it under 100 characters."),
  contactName: optionalTextSchema(150, "Keep it under 150 characters."),
  email: optionalTextSchema(254, "Keep it under 254 characters."),
  phone: optionalTextSchema(32, "Keep it under 32 characters."),
  website: optionalTextSchema(300, "Keep it under 300 characters."),
  notes: optionalTextSchema(1000, "Keep notes under 1000 characters."),
  plannedAmountCents: plannedAmountSchema,
  status: z.enum(["prospect", "considering", "booked", "not-proceeding"]).optional(),
});

export type UpdateVendorInput = z.input<typeof updateVendorSchema>;

/**
 * Edits a vendor - only the fields actually present in `input` are
 * written. Every optional/nullable field here uses `.optional().transform(...)`,
 * so presence is checked against the raw `input`, not the parsed output -
 * see `updateTask`'s own comment (`@/lib/wedding/tasks`) for why the
 * parsed value alone can't distinguish "omitted" from "explicitly cleared".
 */
export async function updateVendor(vendorId: string, input: UpdateVendorInput): Promise<VendorMutationResult> {
  await requireUser();

  const parsed = updateVendorSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    category?: string | null;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    notes?: string | null;
    planned_amount_cents?: number | null;
    status?: string;
  } = {};

  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (Object.hasOwn(input, "category")) patch.category = parsed.data.category;
  if (Object.hasOwn(input, "contactName")) patch.contact_name = parsed.data.contactName;
  if (Object.hasOwn(input, "email")) patch.email = parsed.data.email;
  if (Object.hasOwn(input, "phone")) patch.phone = parsed.data.phone;
  if (Object.hasOwn(input, "website")) patch.website = parsed.data.website;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;
  if (Object.hasOwn(input, "plannedAmountCents")) patch.planned_amount_cents = parsed.data.plannedAmountCents;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_vendors").update(patch).eq("id", vendorId).select(VENDOR_COLUMNS).maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { status: "invalid", message: "You already have a vendor with that name." };
    }
    console.error("updateVendor: failed to update vendor", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }
  if (!data) {
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", vendor: mapVendorRow(data) };
}

export type DeleteVendorResult = { status: "success" } | { status: "error"; message: string };

/** Deletes a vendor. Linked expenses are NOT deleted - `wedding_expenses.vendor_id` is `on delete set null`, so they simply lose their vendor link rather than disappearing along with it. */
export async function deleteVendor(vendorId: string): Promise<DeleteVendorResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_vendors").delete().eq("id", vendorId);

  if (error) {
    console.error("deleteVendor: failed to delete vendor", error);
    return { status: "error", message: "Couldn't remove that vendor. Please try again." };
  }

  return { status: "success" };
}

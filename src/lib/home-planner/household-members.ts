import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HouseholdMember, HouseholdRelationship } from "@/types/home-planner";

/**
 * Home Planner household members - `public.household_members`
 * (`supabase/migrations/20260910000000_home_planner_foundation.sql`). Same
 * shape as `@/lib/wedding/guests`: every function calls `requireUser()`
 * itself, and RLS (a join back to `homes.owner_id`) independently enforces
 * the same "only this home's owner" boundary.
 */

const MEMBER_COLUMNS = "id, home_id, name, relationship, notes, created_at, updated_at";

const RELATIONSHIPS = [
  "self",
  "spouse-partner",
  "child",
  "parent",
  "roommate",
  "pet",
  "other",
] as const satisfies readonly HouseholdRelationship[];

type MemberRow = {
  id: string;
  home_id: string;
  name: string;
  relationship: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapMemberRow(row: MemberRow): HouseholdMember {
  return {
    id: row.id,
    homeId: row.home_id,
    name: row.name,
    // Cast, not re-validated: `household_members_relationship_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    relationship: row.relationship as HouseholdRelationship,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getHouseholdMembersForHome(homeId: string): Promise<HouseholdMember[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("household_members")
    .select(MEMBER_COLUMNS)
    .eq("home_id", homeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getHouseholdMembersForHome: failed to load household members", error);
    return [];
  }

  return (data ?? []).map(mapMemberRow);
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const createMemberSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(150, "Keep it under 150 characters."),
  relationship: z.enum(RELATIONSHIPS, { message: "Choose a relationship." }),
  notes: optionalTextSchema(1000, "Keep it under 1000 characters."),
});

export type CreateHouseholdMemberInput = z.input<typeof createMemberSchema>;

export type HouseholdMemberMutationResult =
  | { status: "success"; member: HouseholdMember }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Household member creation (Phase 2: "keep the experience simple") - name, relationship, and optional notes. */
export async function createHouseholdMember(homeId: string, input: CreateHouseholdMemberInput): Promise<HouseholdMemberMutationResult> {
  await requireUser();

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("household_members")
    .insert({ home_id: homeId, name: parsed.data.name, relationship: parsed.data.relationship, notes: parsed.data.notes })
    .select(MEMBER_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createHouseholdMember: failed to create household member", error);
    return { status: "error", message: "Couldn't add that household member. Please try again." };
  }

  return { status: "success", member: mapMemberRow(data) };
}

const updateMemberSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(150, "Keep it under 150 characters.").optional(),
  relationship: z.enum(RELATIONSHIPS, { message: "Choose a relationship." }).optional(),
  notes: optionalTextSchema(1000, "Keep it under 1000 characters."),
});

export type UpdateHouseholdMemberInput = z.input<typeof updateMemberSchema>;

/**
 * Edits a household member - only the fields actually present in `input`
 * are written, the same "presence checked against raw input" convention
 * `updateGuest` establishes (`@/lib/wedding/guests`'s own comment).
 */
export async function updateHouseholdMember(memberId: string, input: UpdateHouseholdMemberInput): Promise<HouseholdMemberMutationResult> {
  await requireUser();

  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; relationship?: string; notes?: string | null } = {};

  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.relationship !== undefined) patch.relationship = parsed.data.relationship;
  if (Object.hasOwn(input, "notes")) patch.notes = parsed.data.notes;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("household_members").update(patch).eq("id", memberId).select(MEMBER_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateHouseholdMember: failed to update household member", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", member: mapMemberRow(data) };
}

export type DeleteHouseholdMemberResult = { status: "success" } | { status: "error"; message: string };

export async function deleteHouseholdMember(memberId: string): Promise<DeleteHouseholdMemberResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("household_members").delete().eq("id", memberId);

  if (error) {
    console.error("deleteHouseholdMember: failed to delete household member", error);
    return { status: "error", message: "Couldn't remove that household member. Please try again." };
  }

  return { status: "success" };
}

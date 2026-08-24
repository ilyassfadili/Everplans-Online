import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Home, HomeType, OwnershipStatus } from "@/types/home-planner";

/**
 * The Home Planner's own user-owned data-access layer - same shape as
 * `@/lib/travel/trips`: every exported function calls `requireUser()`
 * itself and scopes its query to that resolved id, so there is no
 * parameter a caller could pass to make it act on someone else's
 * workspace. Postgres RLS
 * (`supabase/migrations/20260910000000_home_planner_foundation.sql`) is the
 * second, independent enforcement of the same boundary.
 *
 * `server-only`: reads/writes `public.homes` through the server Supabase
 * client and calls the (also server-only) auth DAL. Never safe to import
 * from a Client Component.
 */

const HOME_COLUMNS =
  "id, owner_id, name, home_type, ownership_status, address_line1, address_line2, city, state, postal_code, country, notes, created_at, updated_at";

type HomeRow = {
  id: string;
  owner_id: string;
  name: string;
  home_type: string;
  ownership_status: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapHomeRow(row: HomeRow): Home {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    homeType: row.home_type as HomeType,
    ownershipStatus: row.ownership_status as OwnershipStatus,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns the current user's home workspace, or `null` if they haven't set
 * one up yet - the signal every Home Planner route uses to decide "show the
 * workspace" vs. "show the foundation/setup state". Redirects to sign-in
 * via `requireUser()` if there's no session at all.
 */
export async function getHomeForCurrentUser(): Promise<Home | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("homes").select(HOME_COLUMNS).eq("owner_id", user.id).maybeSingle();

  // A real database/network failure, not "no row yet" (`maybeSingle`
  // already returns `data: null` for that case without an error) - logged
  // for operators, never surfaced as anything more specific than "no
  // workspace," so callers can't distinguish "not set up" from "the
  // database is down" and render the wrong state.
  if (error) {
    console.error("getHomeForCurrentUser: failed to load home", error);
    return null;
  }

  return data ? mapHomeRow(data) : null;
}

const HOME_TYPES = ["house", "apartment", "condo", "townhouse", "mobile-home", "other"] as const satisfies readonly HomeType[];
const OWNERSHIP_STATUSES = ["own", "rent", "other"] as const satisfies readonly OwnershipStatus[];

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const homeSetupSchema = z.object({
  name: z.string().trim().min(1, "Enter a home name.").max(150, "Keep it under 150 characters."),
  homeType: z.enum(HOME_TYPES, { message: "Choose a home type." }),
  ownershipStatus: z.enum(OWNERSHIP_STATUSES, { message: "Choose an ownership status." }),
  addressLine1: optionalTextSchema(200, "Keep it under 200 characters."),
  addressLine2: optionalTextSchema(200, "Keep it under 200 characters."),
  city: optionalTextSchema(100, "Keep it under 100 characters."),
  state: optionalTextSchema(100, "Keep it under 100 characters."),
  postalCode: optionalTextSchema(20, "Keep it under 20 characters."),
  country: optionalTextSchema(100, "Keep it under 100 characters."),
  notes: optionalTextSchema(2000, "Keep it under 2000 characters."),
});

export type HomeSetupInput = z.input<typeof homeSetupSchema>;

export type HomeMutationResult =
  | { status: "success"; home: Home }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates the current user's home workspace (Prompt 1 Phase 2's setup
 * flow). Authenticate-then-validate, the sequence every mutation in this
 * codebase follows (see `@/lib/travel/trips`'s own comment).
 *
 * Duplicate-safe two ways: the setup page itself redirects away before this
 * is ever called if a workspace already exists (the common case), and
 * `homes_owner_unique` (the migration) makes a genuine race - a double
 * submit, two tabs - fail at the database layer instead of creating a
 * second workspace. A `23505` unique-violation here is treated as "already
 * set up": the existing row is fetched and returned as if this call had
 * succeeded, the same fallback `createTrip` uses.
 */
export async function createHome(input: HomeSetupInput): Promise<HomeMutationResult> {
  const user = await requireUser();

  const parsed = homeSetupSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("homes")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      home_type: parsed.data.homeType,
      ownership_status: parsed.data.ownershipStatus,
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2,
      city: parsed.data.city,
      state: parsed.data.state,
      postal_code: parsed.data.postalCode,
      country: parsed.data.country,
      notes: parsed.data.notes,
    })
    .select(HOME_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const existing = await getHomeForCurrentUser();
      if (existing) {
        return { status: "success", home: existing };
      }
    }

    console.error("createHome: failed to create home", error);
    return { status: "error", message: "Couldn't set up your home. Please try again." };
  }

  if (!data) {
    return { status: "error", message: "Couldn't set up your home. Please try again." };
  }

  return { status: "success", home: mapHomeRow(data) };
}

/**
 * Updates the current user's home profile in place - the Home Profile
 * screen's "edit" counterpart (Phase 2: "test editing the profile"). Ships
 * every field editable from day one, the same shape `updateTrip` follows.
 * Scoped to `owner_id = auth.uid()` by RLS; `eq("id", homeId)` further
 * narrows to the specific row this call means to change.
 */
export async function updateHome(homeId: string, input: HomeSetupInput): Promise<HomeMutationResult> {
  await requireUser();

  const parsed = homeSetupSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("homes")
    .update({
      name: parsed.data.name,
      home_type: parsed.data.homeType,
      ownership_status: parsed.data.ownershipStatus,
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2,
      city: parsed.data.city,
      state: parsed.data.state,
      postal_code: parsed.data.postalCode,
      country: parsed.data.country,
      notes: parsed.data.notes,
    })
    .eq("id", homeId)
    .select(HOME_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateHome: failed to update home", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", home: mapHomeRow(data) };
}

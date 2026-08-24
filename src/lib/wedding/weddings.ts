import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Wedding } from "@/types/wedding";

/**
 * The Wedding Planner's own user-owned data-access layer - the
 * "getWeddingForCurrentUser / createWedding" pair the onboarding and
 * workspace routes both build on. Same shape as `@/lib/profile`: every
 * exported function calls `requireUser()` itself and scopes its query to
 * that resolved id, so there is no parameter a caller could pass to make
 * either act on someone else's workspace. Postgres RLS
 * (`supabase/migrations/20260823000000_wedding_workspace.sql`) is the
 * second, independent enforcement of the same boundary.
 *
 * `server-only`: reads/writes `public.weddings` through the server
 * Supabase client and calls the (also server-only) auth DAL. Never safe to
 * import from a Client Component.
 */

const WEDDING_COLUMNS = "id, owner_id, partner_one_name, partner_two_name, wedding_date, currency, created_at, updated_at";

type WeddingRow = {
  id: string;
  owner_id: string;
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

function mapWeddingRow(row: WeddingRow): Wedding {
  return {
    id: row.id,
    ownerId: row.owner_id,
    partnerOneName: row.partner_one_name,
    partnerTwoName: row.partner_two_name,
    weddingDate: row.wedding_date,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns the current user's wedding workspace, or `null` if they haven't
 * completed onboarding yet - the signal every Wedding Planner route uses
 * to decide "show the workspace" vs. "redirect to onboarding". Redirects
 * to sign-in via `requireUser()` if there's no session at all.
 */
export async function getWeddingForCurrentUser(): Promise<Wedding | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("weddings").select(WEDDING_COLUMNS).eq("owner_id", user.id).maybeSingle();

  // A real database/network failure, not "no row yet" (`maybeSingle`
  // already returns `data: null` for that case without an error) - logged
  // for operators, never surfaced as anything more specific than "no
  // workspace," so callers can't distinguish "not onboarded" from "the
  // database is down" and render the wrong state.
  if (error) {
    console.error("getWeddingForCurrentUser: failed to load wedding", error);
    return null;
  }

  return data ? mapWeddingRow(data) : null;
}

const createWeddingSchema = z.object({
  partnerOneName: z.string().trim().min(1, "Enter a name.").max(100, "Keep it under 100 characters."),
  partnerTwoName: z.string().trim().min(1, "Enter a name.").max(100, "Keep it under 100 characters."),
  // Free text from a native `<input type="date">`, already `YYYY-MM-DD` or
  // empty - optional, since onboarding never forces a placeholder date.
  weddingDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

export type CreateWeddingInput = z.input<typeof createWeddingSchema>;

export type CreateWeddingResult =
  | { status: "success"; wedding: Wedding }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates the current user's wedding workspace. Authenticate-then-validate
 * (the sequence every mutation in this codebase follows, see
 * `@/lib/profile`'s own comment) so an unauthenticated caller never gets a
 * response that depends on what they sent.
 *
 * Duplicate-safe two ways: the onboarding page itself redirects away
 * before this is ever called if a workspace already exists (the common
 * case), and `weddings_owner_unique` (the migration) makes a genuine race
 * - a double submit, two tabs - fail at the database layer instead of
 * creating a second workspace. A `23505` unique-violation here means
 * exactly that race happened, not a real error, so it's treated as
 * "already onboarded": the existing row is fetched and returned as if
 * this call had succeeded, rather than surfacing an error for something
 * the user didn't do wrong.
 */
export async function createWedding(input: CreateWeddingInput): Promise<CreateWeddingResult> {
  const user = await requireUser();

  const parsed = createWeddingSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("weddings")
    .insert({
      owner_id: user.id,
      partner_one_name: parsed.data.partnerOneName,
      partner_two_name: parsed.data.partnerTwoName,
      wedding_date: parsed.data.weddingDate,
    })
    .select(WEDDING_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const existing = await getWeddingForCurrentUser();
      if (existing) {
        return { status: "success", wedding: existing };
      }
    }

    console.error("createWedding: failed to create wedding", error);
    return { status: "error", message: "Couldn't set up your workspace. Please try again." };
  }

  if (!data) {
    return { status: "error", message: "Couldn't set up your workspace. Please try again." };
  }

  return { status: "success", wedding: mapWeddingRow(data) };
}

/**
 * Changes the wedding date after onboarding (Prompt 3 Phase 1: "If the
 * wedding date is changed, dependent displays should update correctly").
 * The one field editable post-onboarding today - not a general "edit
 * wedding details" endpoint, since nothing else has asked to be editable
 * yet. `null` clears it back to "not decided yet," the same state
 * onboarding itself allows.
 */
export async function updateWeddingDate(weddingId: string, weddingDate: string | null): Promise<CreateWeddingResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("weddings")
    .update({ wedding_date: weddingDate })
    .eq("id", weddingId)
    .select(WEDDING_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateWeddingDate: failed to update wedding date", error);
    return { status: "error", message: "Couldn't save that date. Please try again." };
  }

  return { status: "success", wedding: mapWeddingRow(data) };
}

import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { TRAVEL_PLANNER_PRODUCT } from "@/config/products/travel-planner";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Trip, TripType } from "@/types/travel";

import { parseAmountToCents } from "./currency";

/**
 * The Travel Planner's own user-owned data-access layer - the
 * "getTripForCurrentUser / createTrip / updateTrip" set every Travel
 * Planner route builds on. Same shape as `@/lib/wedding/weddings`: every
 * exported function calls `requireUser()` itself and scopes its query to
 * that resolved id, so there is no parameter a caller could pass to make
 * any of them act on someone else's workspace. Postgres RLS
 * (`supabase/migrations/20260907000000_travel_planner_foundation.sql`) is
 * the second, independent enforcement of the same boundary.
 *
 * `server-only`: reads/writes `public.trips` through the server Supabase
 * client and calls the (also server-only) auth DAL. Never safe to import
 * from a Client Component.
 */

const TRIP_COLUMNS =
  "id, owner_id, destination, start_date, end_date, traveler_count, trip_type, trip_goals, notes, total_budget_cents, currency, created_at, updated_at";

const TRIP_TYPES = ["vacation", "family", "couple", "solo", "business", "road-trip", "other"] as const satisfies readonly TripType[];

type TripRow = {
  id: string;
  owner_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  traveler_count: number;
  trip_type: string;
  trip_goals: string | null;
  notes: string | null;
  total_budget_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

function mapTripRow(row: TripRow): Trip {
  return {
    id: row.id,
    ownerId: row.owner_id,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    travelerCount: row.traveler_count,
    tripType: row.trip_type as TripType,
    tripGoals: row.trip_goals,
    notes: row.notes,
    totalBudgetCents: row.total_budget_cents,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns the current user's trip workspace, or `null` if they haven't
 * completed trip setup yet - "does a trip exist," on its own, with no
 * opinion on entitlement. Used directly by the sidebar Planner Switcher
 * and "My Planners" (`@/lib/planner-workspaces`, `@/lib/owned-planners`),
 * which only ever ask "does this user have a real workspace to show,"
 * never "should they." Every Travel Planner *page*, in contrast, calls
 * `requireTripForCurrentUser()` below - the entitlement-authoritative
 * gate. Redirects to sign-in via `requireUser()` if there's no session at
 * all.
 */
export async function getTripForCurrentUser(): Promise<Trip | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("trips").select(TRIP_COLUMNS).eq("owner_id", user.id).maybeSingle();

  // A real database/network failure, not "no row yet" (`maybeSingle`
  // already returns `data: null` for that case without an error) - logged
  // for operators, never surfaced as anything more specific than "no
  // workspace," so callers can't distinguish "not set up" from "the
  // database is down" and render the wrong state.
  if (error) {
    console.error("getTripForCurrentUser: failed to load trip", error);
    return null;
  }

  return data ? mapTripRow(data) : null;
}

export type TravelPlannerAccessResult =
  /** No active Travel Planner entitlement - the customer needs to buy it (or a prior purchase's entitlement was revoked/refunded) before anything else. Authoritative and checked BEFORE trip existence, the same "revoked entitlements cannot access the product" rule `resolveBudgetPlannerAccess` already establishes. */
  | { status: "needs-purchase" }
  /** Entitled, but hasn't completed trip setup yet - no `trips` row exists. */
  | { status: "needs-onboarding" }
  /** Entitled AND set up - the only state that returns a real, usable `trip`. */
  | { status: "granted"; trip: Trip };

/**
 * The single, reusable "can the current user use Travel Planner right now"
 * check (Prompt 6 Phase 1/2) - every Travel Planner page calls this
 * (via `requireTripForCurrentUser()` below) instead of `getTripForCurrentUser()`
 * directly, so entitlement is the authoritative gate everywhere, not just
 * at onboarding. Layered exactly as `resolveBudgetPlannerAccess` already
 * establishes: authentication (`requireUser()`, inside `hasProductAccess`)
 * is separate from product entitlement (`hasProductAccess` itself) is
 * separate from product implementation (`getTripForCurrentUser()`, this
 * product's own workspace data) - never collapsed into one boolean.
 */
export async function resolveTravelPlannerAccess(): Promise<TravelPlannerAccessResult> {
  const user = await requireUser();

  const entitled = await hasProductAccess(user.id, TRAVEL_PLANNER_PRODUCT.plannerId);
  if (!entitled) {
    return { status: "needs-purchase" };
  }

  const trip = await getTripForCurrentUser();
  if (!trip) {
    return { status: "needs-onboarding" };
  }

  return { status: "granted", trip };
}

/**
 * The one-line version of `resolveTravelPlannerAccess()` every page
 * actually calls: redirects to checkout/onboarding as needed and returns
 * the real `Trip` only once access is fully granted. Keeps every page's
 * own gate to a single call instead of re-deriving the same three-way
 * redirect logic per route.
 */
export async function requireTripForCurrentUser(): Promise<Trip> {
  const access = await resolveTravelPlannerAccess();

  if (access.status === "needs-purchase") {
    redirect("/app/travel-planner/checkout");
  }
  if (access.status === "needs-onboarding") {
    redirect("/app/travel-planner/onboarding");
  }

  return access.trip;
}

const tripSetupSchema = z
  .object({
    destination: z.string().trim().min(1, "Enter a destination.").max(200, "Keep it under 200 characters."),
    // Free text from a native `<input type="date">`/`DatePicker`, already
    // `YYYY-MM-DD` - required, since trip setup is the one screen that
    // establishes when a trip actually happens.
    startDate: z.string().trim().min(1, "Choose a start date."),
    endDate: z.string().trim().min(1, "Choose an end date."),
    travelerCount: z.coerce
      .number({ message: "Enter the number of travelers." })
      .int("Whole numbers only.")
      .min(1, "At least 1 traveler.")
      .max(50, "Keep it to 50 or fewer."),
    tripType: z.enum(TRIP_TYPES, { message: "Choose a trip type." }),
    tripGoals: z
      .string()
      .trim()
      .max(500, "Keep it under 500 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
    notes: z
      .string()
      .trim()
      .max(2000, "Keep it under 2000 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export type TripSetupInput = z.input<typeof tripSetupSchema>;

export type TripMutationResult =
  | { status: "success"; trip: Trip }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates the current user's trip workspace. Authenticate-then-validate
 * (the sequence every mutation in this codebase follows, see
 * `@/lib/wedding/weddings`'s own comment) so an unauthenticated caller
 * never gets a response that depends on what they sent.
 *
 * Duplicate-safe two ways: the trip setup page itself redirects away
 * before this is ever called if a workspace already exists (the common
 * case), and `trips_owner_unique` (the migration) makes a genuine race - a
 * double submit, two tabs - fail at the database layer instead of creating
 * a second workspace. A `23505` unique-violation here means exactly that
 * race happened, not a real error, so it's treated as "already set up":
 * the existing row is fetched and returned as if this call had succeeded.
 */
export async function createTrip(input: TripSetupInput): Promise<TripMutationResult> {
  const user = await requireUser();

  const parsed = tripSetupSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_id: user.id,
      destination: parsed.data.destination,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      traveler_count: parsed.data.travelerCount,
      trip_type: parsed.data.tripType,
      trip_goals: parsed.data.tripGoals,
      notes: parsed.data.notes,
    })
    .select(TRIP_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const existing = await getTripForCurrentUser();
      if (existing) {
        return { status: "success", trip: existing };
      }
    }

    console.error("createTrip: failed to create trip", error);
    return { status: "error", message: "Couldn't set up your trip. Please try again." };
  }

  if (!data) {
    return { status: "error", message: "Couldn't set up your trip. Please try again." };
  }

  return { status: "success", trip: mapTripRow(data) };
}

/**
 * Updates the current user's trip setup details in place - the Trip Setup
 * screen's "edit" counterpart (Prompt 1 Phase 3: "test editing trip setup
 * information"). Unlike `updateWeddingDate`'s narrow single-field edit,
 * this accepts the same full shape `createTrip` does, since Travel
 * Planner's trip setup ships every field editable from day one rather than
 * expanding one field at a time. Scoped to `owner_id = auth.uid()` by RLS;
 * `eq("id", tripId)` further narrows to the specific row this call means to
 * change.
 */
export async function updateTrip(tripId: string, input: TripSetupInput): Promise<TripMutationResult> {
  await requireUser();

  const parsed = tripSetupSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trips")
    .update({
      destination: parsed.data.destination,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      traveler_count: parsed.data.travelerCount,
      trip_type: parsed.data.tripType,
      trip_goals: parsed.data.tripGoals,
      notes: parsed.data.notes,
    })
    .eq("id", tripId)
    .select(TRIP_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateTrip: failed to update trip", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", trip: mapTripRow(data) };
}

/**
 * Sets the trip's total planned budget (Prompt 3 Phase 1) - a narrow,
 * single-field update kept separate from `updateTrip`'s own trip-setup
 * schema, the same "one field, its own function" shape `updateWeddingDate`
 * already establishes rather than folding budget into the Trip Setup form.
 * Takes the raw typed string (parsed and validated here, server-side, via
 * `parseAmountToCents`) rather than an already-parsed number - the same
 * "validation happens at the server boundary" convention every other
 * monetary field in this codebase follows, so a caller never has to
 * duplicate parsing logic client-side.
 */
export async function updateTripTotalBudget(tripId: string, totalBudget: string): Promise<TripMutationResult> {
  await requireUser();

  const totalBudgetCents = parseAmountToCents(totalBudget);
  if (totalBudgetCents === null) {
    return { status: "invalid", message: "Enter a valid amount." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trips")
    .update({ total_budget_cents: totalBudgetCents })
    .eq("id", tripId)
    .select(TRIP_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateTripTotalBudget: failed to update total budget", error);
    return { status: "error", message: "Couldn't save that amount. Please try again." };
  }

  return { status: "success", trip: mapTripRow(data) };
}

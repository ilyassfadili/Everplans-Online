import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { LIFE_PLANNER_PRODUCT } from "@/config/products/life-planner";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LifePlan } from "@/types/life-planner";

/**
 * The Life Planner's own user-owned data-access layer - the
 * "getLifePlanForCurrentUser / createLifePlan / updateLifePlan" set every
 * Life Planner route builds on. Same shape as `@/lib/travel/trips`: every
 * exported function calls `requireUser()` itself and scopes its query to
 * that resolved id, so there is no parameter a caller could pass to make
 * any of them act on someone else's workspace. Postgres RLS
 * (`supabase/migrations/20260911000000_life_planner_foundation.sql`) is the
 * second, independent enforcement of the same boundary.
 *
 * Prompt 2 adds `updateLifePlan`: the Life Profile form's save action.
 * Unlike `updateTrip` (`@/lib/travel/trips`), this never takes an id from
 * the caller - `life_plans` is one row per owner (`life_plans_owner_unique`),
 * so `owner_id = user.id` alone is enough to find the right row, the same
 * way `updateProfileDetails` (`@/lib/profile`) scopes by `id = user.id`.
 *
 * `server-only`: reads/writes `public.life_plans` through the server
 * Supabase client and calls the (also server-only) auth DAL. Never safe to
 * import from a Client Component.
 */

const LIFE_PLAN_COLUMNS =
  "id, owner_id, planning_identity, current_priorities, important_areas, short_term_direction, long_term_direction, planning_preferences, created_at, updated_at";

type LifePlanRow = {
  id: string;
  owner_id: string;
  planning_identity: string | null;
  current_priorities: string | null;
  important_areas: string | null;
  short_term_direction: string | null;
  long_term_direction: string | null;
  planning_preferences: string | null;
  created_at: string;
  updated_at: string;
};

function mapLifePlanRow(row: LifePlanRow): LifePlan {
  return {
    id: row.id,
    ownerId: row.owner_id,
    planningIdentity: row.planning_identity,
    currentPriorities: row.current_priorities,
    importantAreas: row.important_areas,
    shortTermDirection: row.short_term_direction,
    longTermDirection: row.long_term_direction,
    planningPreferences: row.planning_preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns the current user's life plan workspace, or `null` if they haven't
 * been provisioned one yet - the signal every Life Planner route uses to
 * decide "show the workspace" vs. auto-provision one. Redirects to sign-in
 * via `requireUser()` if there's no session at all.
 */
export async function getLifePlanForCurrentUser(): Promise<LifePlan | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_plans").select(LIFE_PLAN_COLUMNS).eq("owner_id", user.id).maybeSingle();

  // A real database/network failure, not "no row yet" (`maybeSingle`
  // already returns `data: null` for that case without an error) - logged
  // for operators, never surfaced as anything more specific than "no
  // workspace," so callers can't distinguish "not set up" from "the
  // database is down" and render the wrong state.
  if (error) {
    console.error("getLifePlanForCurrentUser: failed to load life plan", error);
    return null;
  }

  return data ? mapLifePlanRow(data) : null;
}

export type LifePlanMutationResult =
  | { status: "success"; plan: LifePlan }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates the current user's life plan workspace - a bare row (every Life
 * Profile field `null`), since Prompt 1 auto-provisions on first visit
 * rather than collecting any input; Prompt 2's Life Profile form is what
 * first fills these fields in.
 *
 * Duplicate-safe two ways: the Life Planner page itself only calls this
 * when `getLifePlanForCurrentUser()` already returned `null` (the common
 * case), and `life_plans_owner_unique` (the migration) makes a genuine race
 * - a double request, two tabs - fail at the database layer instead of
 * creating a second workspace. A `23505` unique-violation here means
 * exactly that race happened, not a real error, so it's treated as
 * "already exists": the existing row is fetched and returned as if this
 * call had succeeded, the same pattern `createTrip` (`@/lib/travel/trips`)
 * follows.
 */
export async function createLifePlan(): Promise<LifePlanMutationResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_plans")
    .insert({ owner_id: user.id })
    .select(LIFE_PLAN_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const existing = await getLifePlanForCurrentUser();
      if (existing) {
        return { status: "success", plan: existing };
      }
    }

    console.error("createLifePlan: failed to create life plan", error);
    return { status: "error", message: "Couldn't set up your Life Planner. Please try again." };
  }

  if (!data) {
    return { status: "error", message: "Couldn't set up your Life Planner. Please try again." };
  }

  return { status: "success", plan: mapLifePlanRow(data) };
}

export type LifePlannerAccessResult =
  /** No active Life Planner entitlement - the customer needs to buy it (or a prior purchase's entitlement was revoked/refunded) before anything else. Authoritative and checked BEFORE plan existence, the same "revoked entitlements cannot access the product" rule `resolveTravelPlannerAccess` already establishes. */
  | { status: "needs-purchase" }
  /** Entitled, but hasn't been provisioned a life plan workspace yet - no `life_plans` row exists. */
  | { status: "needs-onboarding" }
  /** Entitled AND provisioned - the only state that returns a real, usable `plan`. */
  | { status: "granted"; plan: LifePlan };

/**
 * The single, reusable "can the current user use Life Planner right now"
 * check (Prompt 6 Phase 1) - every Life Planner page calls this (via
 * `requireLifePlanForCurrentUser()` below) instead of
 * `getLifePlanForCurrentUser()` directly, so entitlement is the
 * authoritative gate everywhere, not just at first visit. Layered exactly as
 * `resolveTravelPlannerAccess` (`@/lib/travel/trips`) already establishes:
 * authentication (`requireUser()`, inside `hasProductAccess`) is separate
 * from product entitlement (`hasProductAccess` itself) is separate from
 * product implementation (`getLifePlanForCurrentUser()`, this product's own
 * workspace data) - never collapsed into one boolean.
 */
export async function resolveLifePlannerAccess(): Promise<LifePlannerAccessResult> {
  const user = await requireUser();

  const entitled = await hasProductAccess(user.id, LIFE_PLANNER_PRODUCT.plannerId);
  if (!entitled) {
    return { status: "needs-purchase" };
  }

  const plan = await getLifePlanForCurrentUser();
  if (!plan) {
    return { status: "needs-onboarding" };
  }

  return { status: "granted", plan };
}

/**
 * The one-line version of `resolveLifePlannerAccess()` every page actually
 * calls: redirects to checkout as needed and returns the real `LifePlan`
 * only once access is fully granted. Keeps every page's own gate to a
 * single call instead of re-deriving the same redirect logic per route -
 * the single source of truth for the "confirm the root workspace exists,
 * auto-provision if not" behavior every Life Planner route previously
 * inlined for itself (see e.g. the dashboard page's own prior comment on
 * that pattern).
 *
 * Unlike Travel Planner's own `requireTripForCurrentUser` (which redirects
 * to a dedicated `/onboarding` route because trip setup collects real
 * input), a bare `life_plans` row needs no input at all - Life Planner has
 * always auto-provisioned it silently on first visit. So `needs-onboarding`
 * is handled inline here via `createLifePlan()` rather than a redirect: the
 * freshly created plan is returned directly, letting the very request that
 * discovered "no plan yet" render the real workspace immediately instead of
 * bouncing through an extra redirect.
 */
export async function requireLifePlanForCurrentUser(): Promise<LifePlan> {
  const access = await resolveLifePlannerAccess();

  if (access.status === "needs-purchase") {
    redirect("/app/life-planner/checkout");
  }

  if (access.status === "needs-onboarding") {
    const result = await createLifePlan();
    if (result.status === "success") {
      return result.plan;
    }

    // Creation genuinely failed (a database error, not a duplicate-row
    // race - `createLifePlan` already treats that race as success). Fails
    // closed to the dashboard rather than rendering a page that assumes a
    // plan exists; the dashboard's own call to this same function will
    // retry provisioning on the next request.
    redirect("/app/life-planner");
  }

  return access.plan;
}

// Every Life Profile field is free text, optional, and nullable - the same
// "empty string in means null out" normalization `tripSetupSchema`
// (`@/lib/travel/trips`) applies to `tripGoals`/`notes`, applied here to all
// six fields instead of just two. 2000 characters matches `notes`' own
// ceiling there - long enough for a few honest paragraphs, short enough to
// stay a reflection rather than a document.
const lifeProfileSchema = z.object({
  planningIdentity: z
    .string()
    .trim()
    .max(2000, "Keep it under 2000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  currentPriorities: z
    .string()
    .trim()
    .max(2000, "Keep it under 2000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  importantAreas: z
    .string()
    .trim()
    .max(2000, "Keep it under 2000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  shortTermDirection: z
    .string()
    .trim()
    .max(2000, "Keep it under 2000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  longTermDirection: z
    .string()
    .trim()
    .max(2000, "Keep it under 2000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  planningPreferences: z
    .string()
    .trim()
    .max(2000, "Keep it under 2000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

// `z.input`, not `z.infer`/`z.output` - same reasoning as
// `UpdateProfileDetailsInput` (`@/lib/profile`): the schema's *output* type
// (`string | null`, already normalized) differs from what a caller should
// actually pass in (`string | undefined`, the raw pre-transform shape
// `updateLifeProfile` reads off `FormData`). Typing this as the output type
// would make `safeParse` reject a caller correctly passing `undefined` for
// "left this field blank."
export type LifeProfileInput = z.input<typeof lifeProfileSchema>;

/**
 * Updates the current user's Life Profile - the six free-text fields on
 * `life_plans` that make up "who you are, what matters, and where you're
 * headed." Authenticate-then-validate, the same order every mutation in
 * this codebase follows (see `updateProfileDetails`'s own comment on why an
 * unauthenticated caller should never get a response that depends on what
 * they sent).
 *
 * `input` is `unknown`, not `LifeProfileInput` - the Server Action calling
 * this reads raw `FormData`, so validation has to happen here rather than
 * being assumed by the caller.
 */
export async function updateLifePlan(input: unknown): Promise<LifePlanMutationResult> {
  const user = await requireUser();

  const parsed = lifeProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_plans")
    .update({
      planning_identity: parsed.data.planningIdentity,
      current_priorities: parsed.data.currentPriorities,
      important_areas: parsed.data.importantAreas,
      short_term_direction: parsed.data.shortTermDirection,
      long_term_direction: parsed.data.longTermDirection,
      planning_preferences: parsed.data.planningPreferences,
    })
    .eq("owner_id", user.id)
    .select(LIFE_PLAN_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("updateLifePlan: failed to update life plan", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  if (!data) {
    // RLS silently returning zero rows (rather than a PostgREST error) is
    // exactly what a blocked cross-user write - or an update before the
    // workspace row exists at all - looks like; fails closed instead of
    // assuming success from an empty response.
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", plan: mapLifePlanRow(data) };
}

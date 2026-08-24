import "server-only";

import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveEntitlement } from "@/lib/entitlements";
import type { PlannerAccessResult } from "@/types/planner-access";
import type { PlannerCategory, PlannerDefinition } from "@/types/planner-definition";
import type { PlannerStructure } from "@/types/planner-structure";

/**
 * The entire generic planner data-access layer, in one place - the same
 * shape `@/lib/blog.ts` already established for articles: honest empty
 * results today (no planner content source exists yet, so every function
 * here says so rather than fabricating a catalog), with signatures a real
 * source (the `planner_definitions`/`planner_categories` tables in
 * `supabase/migrations/`) can be plugged into later without every caller
 * changing. UI components call these functions; nothing outside this file
 * should query planner data directly - that's the "data-access boundary"
 * PROMPT 3 Phase 1 §6 asks for.
 *
 * `server-only`: the discovery functions will eventually read from
 * Supabase using the server client (see `@/lib/supabase/server.ts`);
 * `resolvePlannerAccess` already does today, via `getCurrentUser()`
 * (`@/lib/auth/dal`) and `getActiveEntitlement` (`@/lib/entitlements`),
 * both themselves server-only. Nothing here is safe to import from a
 * Client Component.
 */

/** Discovery: every published planner definition, for a future catalog listing. Always `[]` until a real source exists. */
export async function getPublishedPlannerDefinitions(): Promise<PlannerDefinition[]> {
  return [];
}

/**
 * Discovery: a single planner definition by its stable slug. Once backed
 * by Supabase, this can only ever resolve to a `published` definition -
 * the RLS policy on `planner_definitions` (see the migration) restricts
 * every reader on the publishable key to `status = 'published'` at the
 * database layer, not merely by convention here. A draft or archived
 * definition is indistinguishable from a nonexistent one to this
 * function, which is the intended behavior: a public detail lookup
 * should 404 either way, not reveal that an unpublished planner exists.
 */
export async function getPlannerDefinitionBySlug(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept to match the real lookup this will become
  slug: string,
): Promise<PlannerDefinition | null> {
  return null;
}

/** Discovery: every planner category, for a future catalog's grouping/filtering. Always `[]` until a real source exists. */
export async function getPlannerCategories(): Promise<PlannerCategory[]> {
  return [];
}

/**
 * Discovery by id, for callers that already have a set of planner ids
 * from somewhere else (`@/lib/dashboard-planners`'s `getActivePlanners`,
 * joining against the current user's own `planner_instances`) rather
 * than a single slug from a URL. Unlike `getPlannerDefinitionBySlug`,
 * this is not itself a public-visibility boundary - a planner a user
 * already has an instance for should still resolve here even if it were
 * later archived, the same reasoning `EntitlementStatus`'s own comment
 * gives for tracking *why* access ended rather than just deleting the
 * record. Always `[]` today, the same as every other discovery function
 * in this file - no real source exists yet to look either id up against.
 */
export async function getPlannerDefinitionsByIds(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept to match the real lookup this will become
  plannerIds: string[],
): Promise<PlannerDefinition[]> {
  return [];
}

/**
 * The actual interactive content (`@/types/planner-structure`'s
 * `PlannerStructure`) for one planner at one schema version - distinct
 * from `getPlannerDefinitionBySlug`, which only returns the catalog
 * shell (see `@/types/planner-structure`'s own top comment on why these
 * stay two separate lookups). `schemaVersion` must match the caller's
 * own `PlannerDefinition.schemaVersion` - a structure fetched for the
 * wrong version is exactly the "customer's saved answers were created
 * against a structure that no longer matches" hazard `schemaVersion`
 * exists to prevent (see that field's own comment).
 *
 * Always `null` today: no planner content storage exists yet (a JSONB
 * column, a CMS, whatever the real source ends up being) - the same
 * "real signature, honest empty" shape every discovery function in this
 * file already follows. `resolvePlannerAccess`'s own `granted` branch is
 * consequently unreachable in practice for the same reason it always has
 * been - nothing upstream of this function can produce real content yet
 * either.
 */
export async function getPlannerStructure(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept to match the real lookup this will become
  plannerId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept to match the real lookup this will become
  schemaVersion: number,
): Promise<PlannerStructure | null> {
  return null;
}

/**
 * Access: "can the current user open this planner?" - the centralized
 * access-resolution service PROMPT 6 Phase 1 §8 and Phase 2 §2 both ask
 * for (conceptually `canUserAccessProduct`/`requireProductAccess`),
 * already established in PROMPT 3 and now backed by a real check rather
 * than a hardcoded stub. Deliberately a separate function from discovery
 * (see `@/types/planner-access`'s own comment) - and internally, a
 * deliberate sequence of independently-reviewable steps matching PROMPT 6
 * Phase 2 §1's authentication → discovery/availability → entitlement
 * layering, never collapsed into one boolean:
 *
 * 1. **Authentication** - is there a session at all?
 * 2. **Discovery** - does this planner exist, and is it published?
 * 3. **Entitlement** - does *this* session have an active grant for it?
 *
 * With no planner content source, every slug still resolves `not-found`
 * at step 2 today (`getPlannerDefinitionBySlug` always returns `null` -
 * see its own comment) - so step 3 remains unreachable in practice, the
 * same way it was before this file called `getActiveEntitlement` at all.
 * The check itself is real now, not a hardcoded "no system exists yet"
 * stub; it simply has nothing to query yet, which is the honest state of
 * a zero-product platform, not a placeholder waiting to be replaced.
 *
 * Reads the session itself (via the DAL) rather than accepting a `userId`
 * parameter - keeps every call site from having to fetch the user first
 * just to ask this question, and means this function can never be called
 * with a caller-supplied identity it didn't verify itself. The verified
 * `user.id` is what then gets passed to `getActiveEntitlement` - never a
 * client-supplied one (see that function's own security note).
 */
export async function resolvePlannerAccess(slug: string): Promise<PlannerAccessResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "unauthenticated" };
  }

  const definition = await getPlannerDefinitionBySlug(slug);
  if (!definition) {
    // Covers both "no such slug" and "exists but isn't published" - RLS
    // makes those indistinguishable to getPlannerDefinitionBySlug (see
    // its own comment), which is exactly right here: neither case should
    // tell the requester an unpublished planner exists.
    return { status: "not-found" };
  }

  // Defense in depth, not the real enforcement: RLS already guarantees
  // getPlannerDefinitionBySlug can't return a non-published row (see its
  // comment), so this should be unreachable once wired to real data. Kept
  // rather than trusted away, on the same "don't assume client-side/one-
  // layer filtering is the only boundary" principle the RLS policy itself
  // follows - a defensive check one layer up costs nothing here.
  if (definition.status !== "published") {
    return { status: "unavailable" };
  }

  const entitlement = await getActiveEntitlement(user.id, definition.id);
  if (!entitlement) {
    // Fails closed: no row, a database error inside getActiveEntitlement,
    // or an ambiguous state all return the same `null` there, and all of
    // them mean the same thing here - no confirmed access, so none is
    // granted. Never defaults to "allow" because a check came back
    // uncertain (PROMPT 6 Phase 2 §7).
    return { status: "unauthorized" };
  }

  return { status: "granted", plannerId: definition.id, schemaVersion: definition.schemaVersion };
}

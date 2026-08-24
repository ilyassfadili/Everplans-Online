/**
 * The generic, product-agnostic domain model for a planner - what
 * describes a planner *product* (its definition/template), as distinct
 * from any data a customer creates while using one. That second kind of
 * data - a customer's actual plan-in-progress - does not exist anywhere
 * in this file on purpose; it belongs to the future planner runtime/
 * persistence work Prompt 3 explicitly defers (see AGENTS.md and the
 * PROMPT 3 brief's "Separate product definition from customer data").
 *
 * Distinct from `@/types/planner`'s `Planner`/`Category`: those are
 * flattened, presentational shapes built for the public marketing site's
 * cards (`categoryName`/`categorySlug` as plain strings, no status, no
 * versioning) - view models, not the domain entity. `PlannerDefinition`
 * here is what a future data source (Supabase table, CMS) actually
 * produces; a view model like the public site's `Planner` gets derived
 * from this one, not the other way around.
 */

/**
 * A planner's lifecycle state. Three states, not a boolean "published":
 * `draft` (being built, never shown to customers), `published` (eligible
 * for discovery), `archived` (no longer offered, but its identifier and
 * historical data must keep resolving rather than disappearing - a
 * customer who bought it shouldn't lose access because it stopped being
 * sold). Discovery queries filter to `published` only; access resolution
 * (see `PlannerAccessResult`) is a separate question from status.
 */
export type PlannerDefinitionStatus = "draft" | "published" | "archived";

/** A reusable grouping a planner definition belongs to - the generic counterpart to the public site's `Category`. */
export interface PlannerCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * What a planner product *is* - never what a specific customer has done
 * with it. Fields are deliberately limited to what discovery, listing,
 * and resolution genuinely need today:
 *
 * - `schemaVersion` is the minimum versioning foundation the brief asks
 *   for: an integer a future runtime can branch on ("this customer's
 *   saved data was created against v1 of this planner's structure") so a
 *   later content change can't silently corrupt or misread existing
 *   customer data. It is not a changelog, a draft/published history, or
 *   anything resembling real version management - just an extensibility
 *   point that costs one column now instead of a migration later.
 * - No planner-specific fields (no `weddingDate`, `budgetAmount`, etc.)
 *   - those belong to whatever a specific future planner product defines
 *   for itself, layered on top of this generic shape, never inside it.
 */
export interface PlannerDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  status: PlannerDefinitionStatus;
  /** Starts at 1 for every planner; incremented only when a change to the planner's structure could affect how existing customer data is interpreted. */
  schemaVersion: number;
  /** Optional discovery artwork. `null` renders the same generic mark `PlannerCard` already falls back to - never a stock/placeholder photo. */
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

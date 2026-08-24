import type { LucideIcon } from "lucide-react";

/**
 * The Store's own access-state concept (Dashboard V2 Prompt 3 Phase 1
 * §11-12) - distinct from `PlannerDefinitionStatus`
 * (`@/types/planner-definition`), which describes the *product's* own
 * publish state (draft/published/archived). This describes *this
 * specific viewer's* relationship to an already-published product: do
 * they already have it, or is it open to acquire. RLS already keeps
 * anything non-`published` out of what the Store ever sees (see
 * `@/lib/planners`'s own comment), so `coming-soon`/`unavailable` exist
 * here as a complete, future-ready contract rather than states real data
 * can currently produce - only `available`/`already-owned` are reachable
 * today, now that the Wedding Planner is a real published product (see
 * `StoreListing`'s own comment).
 */
export type PlannerAccessState = "available" | "coming-soon" | "already-owned" | "unavailable";

/**
 * One card the Store actually renders - deliberately not `PlannerDefinition`
 * itself. The Store has always had two kinds of product to show: entries
 * from the generic, schema-driven catalog (`@/lib/planners`'s
 * `PlannerDefinition`/`PlannerCategory`, still genuinely empty - no seed
 * data belongs there, see that migration's own comment) and real,
 * hand-built products that live entirely outside that generic runtime,
 * like the Wedding Planner (`@/lib/wedding/*`, its own tables, its own
 * routes). `StoreListing` is the common shape both normalize into for
 * display, built in `store/page.tsx` (the natural place to compose across
 * both sources, the same way `wedding-planner/page.tsx` already composes
 * several `@/lib/wedding/*` reads directly) - `StoreProductCard` renders
 * this and nothing product-system-specific, so it never needs to know
 * which source a listing came from.
 */
export interface StoreListing {
  id: string;
  title: string;
  description: string;
  /** Plain label, not a resolved `PlannerCategory` - a hand-built product like Wedding Planner has no row in `planner_categories` to join against. */
  categoryLabel: string;
  icon: LucideIcon;
  /** Destination once the visitor already has access - `already-owned`'s "Open Planner" goes straight into the app, no reason to detour through the sales page again. */
  href: string;
  /** Destination while still `available` - the product's landing page (`/products/[slug]`), so Store stays discovery and the landing page stays the sales surface. Falls back to `href` for a listing with no landing page (e.g. the still-empty generic catalog). */
  availableHref?: string;
  accessState: PlannerAccessState;
  /** CTA copy when `accessState` is `"available"` - e.g. the generic catalog's "View in Store" vs. Wedding Planner's "Start Planning". */
  availableCtaLabel: string;
  /** CTA copy when `accessState` is `"already-owned"` - e.g. "Open Planner". */
  ownedCtaLabel: string;
  /** Whether this planner is free - mirrors `Planner.isFree` (`@/types/planner`), same reasoning: Everplans planners are priced individually, not bundled free with an account. */
  isFree: boolean;
  /** Integer minor units (cents), matching `Planner.priceCents`'s own convention - `null` when `isFree` is `true`, or a real price genuinely isn't known yet. */
  priceCents: number | null;
  /** Mirrors `Planner.imageUrl` (`@/types/planner`) - absent renders `StoreProductCard`'s existing icon placeholder. */
  imageUrl?: string;
}

import type { LucideIcon } from "lucide-react";

/**
 * The shape of a planner product as the public discovery catalog
 * (`/planners`, `@/lib/planner-catalog`) shows it. Two real sources feed
 * this today: the generic, schema-driven `planner_definitions` catalog
 * (`@/lib/planners` - still genuinely empty) and real, hand-built products
 * with their own Product Landing Page (`@/config/products` - today, the
 * Wedding Planner) - see `getPublishedPlanners()`'s own comment for how
 * they compose into one list, the same list the authenticated Store
 * (`@/types/store`'s `StoreListing`) shows, so the two surfaces can never
 * advertise a different set of real products.
 */
export interface Planner {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryName: string;
  categorySlug: string;
  /** Where `PlannerCard` links - defaults to `/planners/${slug}` when absent. A hand-built product overrides this to its real Product Landing Page (`/products/${slug}`) - that route exists today; a generic catalog planner's own public detail page doesn't yet, so it deliberately has nothing to override to. */
  href?: string;
  /** Whether this planner requires purchase - Everplans itself is a platform, not a universally free product; individual planners choose their own availability. Derived from the same real source every other field here comes from (`ProductPricing.model` for a hand-built product), never hardcoded per card. */
  isFree: boolean;
  /** Integer minor units (cents), matching this codebase's one monetary convention (see `@/lib/wedding/currency.ts`) - never a floating-point dollar amount. `null` when `isFree` is `true`, or when a real price genuinely isn't known yet. */
  priceCents: number | null;
  /** Path under `public/` for the card's marketing image (`ProductLandingConfig.coverImageSrc`) - absent renders `PlannerCard`'s existing icon placeholder rather than a broken image. */
  imageUrl?: string;
}

/**
 * A category as the public `/categories` page shows it - real, static
 * copy from `@/config/categories`, plus a `plannerCount` computed fresh
 * from `getPublishedPlanners()` on every read (`getCategories()`,
 * `@/lib/planner-catalog`) rather than stored, so it can never drift out
 * of sync with what's actually published.
 */
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  plannerCount: number;
}

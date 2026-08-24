import "server-only";

import { categoryDefinitions } from "@/config/categories";
import { getProductLandingConfig, productLandingSlugs } from "@/config/products";
import { getPlannerCategories, getPublishedPlannerDefinitions } from "@/lib/planners";
import type { Category, Planner } from "@/types/planner";

/**
 * The public discovery catalog's (`/planners`) real "what's published"
 * list - composed the same way the authenticated Store composes its own
 * listings (`store/page.tsx`'s own comment), and deliberately from the
 * exact same two sources, so the two surfaces can never show a different
 * set of real products:
 *
 * 1. The generic, schema-driven catalog (`getPublishedPlannerDefinitions`,
 *    `getPlannerCategories` - `@/lib/planners`) - still genuinely empty,
 *    exactly as it's meant to be until a real definition is published.
 * 2. Real, hand-built products with their own Product Landing Page
 *    (`@/config/products`) - today, exactly one: the Wedding Planner. Its
 *    copy (name/description/category) is read directly from
 *    `ProductLandingConfig`, never re-typed here - the landing page and
 *    the catalog card describing the same product can't drift out of sync
 *    with each other because there is only one place that copy is written.
 *
 * Public and unauthenticated, matching `/products/[slug]`'s own "no auth
 * check, no per-viewer state" shape (see that route's comment) - unlike the
 * Store, nothing here needs an access-state concept, since a signed-out
 * visitor isn't "already owning" anything yet.
 */
export async function getPublishedPlanners(): Promise<Planner[]> {
  const [definitions, categories] = await Promise.all([getPublishedPlannerDefinitions(), getPlannerCategories()]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const catalogPlanners: Planner[] = definitions.map((definition) => {
    const category = categoryById.get(definition.categoryId);
    return {
      id: definition.id,
      slug: definition.slug,
      title: definition.title,
      description: definition.description,
      categoryName: category?.name ?? "Planner",
      categorySlug: category?.slug ?? "planner",
      // The generic, schema-driven catalog has no pricing model of its own
      // yet (`planner_definitions` carries no price column) - defaults to
      // free rather than inventing a number, and is entirely theoretical
      // today since `definitions` is always `[]` until a real one is
      // published. Wire this to a real column the day one exists.
      isFree: true,
      priceCents: null,
    };
  });

  const productPlanners: Planner[] = productLandingSlugs.map((slug) => {
    // Non-null: `slug` came from this same registry's own keys.
    const config = getProductLandingConfig(slug)!;
    return {
      id: config.slug,
      slug: config.slug,
      title: config.name,
      description: config.seo.description,
      categoryName: config.category,
      categorySlug: config.categorySlug,
      href: `/products/${config.slug}`,
      // Real availability, read from the same `ProductPricing` the landing
      // page's own pricing section renders - never a second, independently
      // maintained "is this free" flag that could drift from the page
      // explaining the actual terms.
      isFree: config.pricing.model === "free",
      priceCents: config.pricing.priceCents,
      imageUrl: config.coverImageSrc,
    };
  });

  return [...productPlanners, ...catalogPlanners];
}

/**
 * The public `/categories` page's real category list - `@/config/categories`'
 * static copy (name/description/icon), each one paired with a real count of
 * how many `getPublishedPlanners()` actually belong to it today. Not stored
 * anywhere: recomputed on every read, so a count can never go stale the way
 * a cached or hand-typed number could. Every category starts at `0` until a
 * planner's `categorySlug` matches it - today, only `"wedding"` does.
 */
export async function getCategories(): Promise<Category[]> {
  const planners = await getPublishedPlanners();
  const countBySlug = new Map<string, number>();
  for (const planner of planners) {
    countBySlug.set(planner.categorySlug, (countBySlug.get(planner.categorySlug) ?? 0) + 1);
  }

  return categoryDefinitions.map((category) => ({
    id: category.slug,
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    plannerCount: countBySlug.get(category.slug) ?? 0,
  }));
}

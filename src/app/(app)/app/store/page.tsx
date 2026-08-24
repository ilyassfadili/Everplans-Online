import { Compass, Heart, Home, PiggyBank, Plane, Store as StoreIcon } from "lucide-react";
import type { Metadata } from "next";

import { Container, EmptyState } from "@/components/ui";
import { getProductLandingConfig } from "@/config/products";
import { getBudgetPlanForCurrentUser } from "@/lib/budget/plans";
import { requireUser } from "@/lib/auth/dal";
import { getActiveEntitlement } from "@/lib/entitlements";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getPlannerCategories, getPublishedPlannerDefinitions } from "@/lib/planners";
import { getTripForCurrentUser } from "@/lib/travel/trips";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";
import type { StoreListing } from "@/types/store";

import { PageHeader } from "../_components/page-header";
import { StoreProductCard } from "./_components/store-product-card";

export const metadata: Metadata = {
  title: "Store",
  robots: { index: false, follow: false },
};

/**
 * `/app/store` - the real Store foundation Dashboard V2 Prompt 3 asks for.
 * Two product sources compose into one list of `StoreListing`s
 * (`@/types/store`), never two competing catalogs on screen at once:
 *
 * 1. The generic, schema-driven catalog (`getPublishedPlannerDefinitions`,
 *    `getPlannerCategories` - `@/lib/planners`) - still genuinely empty,
 *    exactly as it's meant to be until a real definition is published (see
 *    that file's own comment). Untouched by this page beyond mapping its
 *    output into a `StoreListing`.
 * 2. Real, hand-built products that live entirely outside that generic
 *    runtime - today, five: the Wedding Planner, the Budget Planner, the
 *    Travel Planner, the Life Planner, and the Home Planner
 *    (`@/lib/wedding/weddings`, `@/lib/budget/plans`, `@/lib/travel/trips`,
 *    `@/lib/life-planner/life-plans`, `@/lib/home-planner/homes`, each with
 *    its own tables and routes under `/app/wedding-planner` /
 *    `/app/budget-planner` / `/app/travel-planner` / `/app/life-planner` /
 *    `/app/home-planner`). None of them is, or should become, a row in
 *    `planner_definitions` - it was never built on that generic
 *    schema-driven `PlannerRuntime` at all, so pretending otherwise would
 *    route its CTA into a runtime with no real content for it
 *    (`getPlannerStructure` has no source for it and never will). Its copy
 *    (title/description/category) is read from `getProductLandingConfig()`
 *    (`@/config/products`), never re-typed here - the exact same source
 *    `getPublishedPlanners()` (`@/lib/planner-catalog`) reads for the
 *    public `/planners` catalog, so the Store and the public catalog can
 *    never advertise a different Wedding Planner. Composing it here, in
 *    the page that already owns "what does the Store show," is the same
 *    pattern `wedding-planner/page.tsx` itself uses to gather several
 *    `@/lib/wedding/*` reads directly - not a second Store architecture,
 *    just this one doing its actual job.
 *
 * Access state is resolved per source, not by one shared query: the
 * generic catalog still goes through `getActiveEntitlement` (Backend
 * Prompt 6); the Wedding Planner's is `getWeddingForCurrentUser()` - has
 * this viewer already completed onboarding, the same signal the workspace
 * route itself gates on. Its CTA destination now depends on that state:
 * `available` sends a visitor to the public Product Landing Page
 * (`availableHref: "/products/wedding-planner"` - `@/config/products`,
 * `(site)/products/[slug]`) to actually sell the product, while
 * `already-owned` skips straight back into the app (`href:
 * "/app/wedding-planner"`) - no reason to re-show the sales page to someone
 * who already has a workspace. That route already redirects an unonboarded
 * visitor to `/app/wedding-planner/onboarding`, and onboarding itself
 * already redirects away if a workspace exists (`weddings_owner_unique`
 * backs that at the database layer too) - so this page never risks creating
 * a duplicate workspace, it just reuses the flow that already prevents one.
 */
export default async function StorePage() {
  const user = await requireUser();

  const [definitions, categories, wedding, budgetPlan, trip, lifePlan, home] = await Promise.all([
    getPublishedPlannerDefinitions(),
    getPlannerCategories(),
    getWeddingForCurrentUser(),
    getBudgetPlanForCurrentUser(),
    getTripForCurrentUser(),
    getLifePlanForCurrentUser(),
    getHomeForCurrentUser(),
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const catalogListings = await Promise.all(
    definitions.map(async (definition): Promise<StoreListing> => {
      const entitlement = await getActiveEntitlement(user.id, definition.id);
      return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        categoryLabel: categoryById.get(definition.categoryId)?.name ?? "Planner",
        icon: StoreIcon,
        href: `/app/planners/${definition.slug}`,
        accessState: entitlement ? "already-owned" : "available",
        availableCtaLabel: "View in Store",
        ownedCtaLabel: "Open Planner",
        // The generic catalog has no pricing model of its own yet
        // (`planner_definitions` carries no price column) - same default
        // `getPublishedPlanners()` uses (`@/lib/planner-catalog`), entirely
        // theoretical today since `definitions` is always `[]`.
        isFree: true,
        priceCents: null,
      };
    }),
  );

  // Non-null: "wedding-planner" is a real key in the Product Landing Page
  // registry (`@/config/products`) - the same config `/products/wedding-planner`
  // itself renders from.
  const weddingConfig = getProductLandingConfig("wedding-planner")!;
  const weddingPlannerListing: StoreListing = {
    id: weddingConfig.slug,
    title: weddingConfig.name,
    description: weddingConfig.seo.description,
    categoryLabel: weddingConfig.category,
    icon: Heart,
    href: weddingConfig.ctaHref,
    availableHref: `/products/${weddingConfig.slug}`,
    accessState: wedding ? "already-owned" : "available",
    availableCtaLabel: weddingConfig.hero.primaryCtaLabel,
    ownedCtaLabel: "Open Planner",
    // Read from the same `ProductPricing` the landing page's own pricing
    // section renders - never a second, independently-typed price that
    // could drift from the page explaining the actual terms.
    isFree: weddingConfig.pricing.model === "free",
    priceCents: weddingConfig.pricing.priceCents,
    imageUrl: weddingConfig.coverImageSrc,
  };

  // Non-null: "budget-planner" is a real key in the Product Landing Page
  // registry (`@/config/products`) - same source `/products/budget-planner`
  // itself renders from.
  const budgetConfig = getProductLandingConfig("budget-planner")!;
  const budgetPlannerListing: StoreListing = {
    id: budgetConfig.slug,
    title: budgetConfig.name,
    description: budgetConfig.seo.description,
    categoryLabel: budgetConfig.category,
    icon: PiggyBank,
    href: budgetConfig.ctaHref,
    availableHref: `/products/${budgetConfig.slug}`,
    accessState: budgetPlan ? "already-owned" : "available",
    availableCtaLabel: budgetConfig.hero.primaryCtaLabel,
    ownedCtaLabel: "Open Planner",
    isFree: budgetConfig.pricing.model === "free",
    priceCents: budgetConfig.pricing.priceCents,
    imageUrl: budgetConfig.coverImageSrc,
  };

  // Non-null: "travel-planner" is a real key in the Product Landing Page
  // registry (`@/config/products`) - same source `/products/travel-planner`
  // itself renders from.
  const travelConfig = getProductLandingConfig("travel-planner")!;
  const travelPlannerListing: StoreListing = {
    id: travelConfig.slug,
    title: travelConfig.name,
    description: travelConfig.seo.description,
    categoryLabel: travelConfig.category,
    icon: Plane,
    href: travelConfig.ctaHref,
    availableHref: `/products/${travelConfig.slug}`,
    accessState: trip ? "already-owned" : "available",
    availableCtaLabel: travelConfig.hero.primaryCtaLabel,
    ownedCtaLabel: "Open Planner",
    isFree: travelConfig.pricing.model === "free",
    priceCents: travelConfig.pricing.priceCents,
    imageUrl: travelConfig.coverImageSrc,
  };

  // Non-null: "life-planner" is a real key in the Product Landing Page
  // registry (`@/config/products`) - same source `/products/life-planner`
  // itself renders from.
  const lifePlannerConfig = getProductLandingConfig("life-planner")!;
  const lifePlannerListing: StoreListing = {
    id: lifePlannerConfig.slug,
    title: lifePlannerConfig.name,
    description: lifePlannerConfig.seo.description,
    categoryLabel: lifePlannerConfig.category,
    icon: Compass,
    href: lifePlannerConfig.ctaHref,
    availableHref: `/products/${lifePlannerConfig.slug}`,
    accessState: lifePlan ? "already-owned" : "available",
    availableCtaLabel: lifePlannerConfig.hero.primaryCtaLabel,
    ownedCtaLabel: "Open Planner",
    isFree: lifePlannerConfig.pricing.model === "free",
    priceCents: lifePlannerConfig.pricing.priceCents,
    imageUrl: lifePlannerConfig.coverImageSrc,
  };

  // Non-null: "home-planner" is a real key in the Product Landing Page
  // registry (`@/config/products`) - same source `/products/home-planner`
  // itself renders from.
  const homePlannerConfig = getProductLandingConfig("home-planner")!;
  const homePlannerListing: StoreListing = {
    id: homePlannerConfig.slug,
    title: homePlannerConfig.name,
    description: homePlannerConfig.seo.description,
    categoryLabel: homePlannerConfig.category,
    icon: Home,
    href: homePlannerConfig.ctaHref,
    availableHref: `/products/${homePlannerConfig.slug}`,
    accessState: home ? "already-owned" : "available",
    availableCtaLabel: homePlannerConfig.hero.primaryCtaLabel,
    ownedCtaLabel: "Open Planner",
    isFree: homePlannerConfig.pricing.model === "free",
    priceCents: homePlannerConfig.pricing.priceCents,
    imageUrl: homePlannerConfig.coverImageSrc,
  };

  const listings = [
    weddingPlannerListing,
    budgetPlannerListing,
    travelPlannerListing,
    lifePlannerListing,
    homePlannerListing,
    ...catalogListings,
  ];

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Store" description="Discover interactive planners as they’re published." />

      {/* Unreachable today - the Wedding Planner listing above is always present - kept as the honest empty state for the case this page was already built for: a catalog with genuinely nothing published. */}
      {listings.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          titleAs="h2"
          title="New planning experiences are coming soon"
          description="The Store will fill up with interactive planning experiences as they become available - there's nothing published yet, but this is exactly where they’ll appear."
          className="py-10 sm:py-14 md:py-16"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <StoreProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </Container>
  );
}

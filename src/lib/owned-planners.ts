import "server-only";

import { PLANNER_WORKSPACE_ICONS } from "@/app/(app)/_components/planner-workspace-icons";
import { getProductLandingConfig } from "@/config/products";
import { getBudgetPlanForCurrentUser } from "@/lib/budget/plans";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getPlannerDefinitionsByIds } from "@/lib/planners";
import { getUserPlannerInstances } from "@/lib/planner-persistence";
import { getTripForCurrentUser } from "@/lib/travel/trips";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";
import type { StoreListing } from "@/types/store";

/**
 * "Every planner this user actually has," shaped as `StoreListing` - the
 * exact same card contract `StoreProductCard` (`/app/store`) already
 * renders, reused rather than duplicated so "My Planners" cards are
 * pixel-identical to their Store counterparts by construction, not by two
 * components independently trying to match. Every listing here is always
 * `accessState: "already-owned"` - ownership is precisely what qualified a
 * planner for this list in the first place.
 *
 * Composes the same sources `getUserPlannerWorkspaces()`
 * (`@/lib/planner-workspaces`) already established for the sidebar
 * switcher: the Wedding Planner, the Budget Planner, the Travel Planner,
 * the Home Planner, and any generic catalog planner the user has actually
 * started.
 * `/app/planners` used to show *only* the generic catalog, deliberately
 * excluding Wedding/Budget on the theory that they "already have their own
 * sidebar section." In
 * practice that made a page literally named "My Planners" show "nothing
 * published" to a user who owns and uses one daily - fixed here rather
 * than preserved as a stale architectural distinction nobody visiting this
 * page actually cares about.
 */
export async function getOwnedPlanners(): Promise<StoreListing[]> {
  const [wedding, budgetPlan, trip, home, instances] = await Promise.all([
    getWeddingForCurrentUser(),
    getBudgetPlanForCurrentUser(),
    getTripForCurrentUser(),
    getHomeForCurrentUser(),
    getUserPlannerInstances(),
  ]);

  const owned: StoreListing[] = [];

  if (wedding) {
    const config = getProductLandingConfig("wedding-planner");
    owned.push({
      id: "wedding-planner",
      title: "Wedding Planner",
      description: config?.seo.description ?? "Your wedding checklist, budget, guests, and vendors, all in one place.",
      categoryLabel: config?.category ?? "Wedding",
      icon: PLANNER_WORKSPACE_ICONS.dashboard,
      href: "/app/wedding-planner",
      accessState: "already-owned",
      availableCtaLabel: config?.hero.primaryCtaLabel ?? "Open Planner",
      ownedCtaLabel: "Open Planner",
      isFree: config?.pricing.model === "free",
      priceCents: config?.pricing.priceCents ?? null,
      imageUrl: config?.coverImageSrc,
    });
  }

  if (budgetPlan) {
    const config = getProductLandingConfig("budget-planner");
    owned.push({
      id: "budget-planner",
      title: "Budget Planner",
      description: config?.seo.description ?? "Your income, budget, spending, and goals, all in one place.",
      categoryLabel: config?.category ?? "Money & Finances",
      icon: PLANNER_WORKSPACE_ICONS.budget,
      href: "/app/budget-planner",
      accessState: "already-owned",
      availableCtaLabel: config?.hero.primaryCtaLabel ?? "Open Planner",
      ownedCtaLabel: "Open Planner",
      isFree: config?.pricing.model === "free",
      priceCents: config?.pricing.priceCents ?? null,
      imageUrl: config?.coverImageSrc,
    });
  }

  if (trip) {
    // `getProductLandingConfig("travel-planner")` resolves `undefined` -
    // deliberately not yet registered in `@/config/products` (its Product
    // Landing Page is Prompt 5 scope, not this one) - the same `config?.x
    // ?? fallback` shape Wedding/Budget already lean on for exactly this
    // "not published yet" case.
    const config = getProductLandingConfig("travel-planner");
    owned.push({
      id: "travel-planner",
      title: "Travel Planner",
      description: config?.seo.description ?? "Your destination, dates, travelers, and trip details, all in one place.",
      categoryLabel: config?.category ?? "Travel & Adventures",
      icon: PLANNER_WORKSPACE_ICONS.trip,
      href: "/app/travel-planner",
      accessState: "already-owned",
      availableCtaLabel: config?.hero.primaryCtaLabel ?? "Open Planner",
      ownedCtaLabel: "Open Planner",
      isFree: config?.pricing.model === "free",
      priceCents: config?.pricing.priceCents ?? null,
      imageUrl: config?.coverImageSrc,
    });
  }

  if (home) {
    const config = getProductLandingConfig("home-planner");
    owned.push({
      id: "home-planner",
      title: "Home Planner",
      description: config?.seo.description ?? "Your rooms, inventory, maintenance, bills, documents, and projects, all in one place.",
      categoryLabel: config?.category ?? "Home & Moving",
      icon: PLANNER_WORKSPACE_ICONS.home,
      href: "/app/home-planner",
      accessState: "already-owned",
      availableCtaLabel: config?.hero.primaryCtaLabel ?? "Open Planner",
      ownedCtaLabel: "Open Planner",
      isFree: config?.pricing.model === "free",
      priceCents: config?.pricing.priceCents ?? null,
      imageUrl: config?.coverImageSrc,
    });
  }

  if (instances.length > 0) {
    const definitions = await getPlannerDefinitionsByIds(instances.map((instance) => instance.plannerId));
    const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));

    for (const instance of instances) {
      const definition = definitionById.get(instance.plannerId);
      // An instance whose definition no longer resolves - skipped rather
      // than rendered as a card with no real name/description to show, the
      // same defensive shape `getUserPlannerWorkspaces` already applies.
      if (!definition) continue;

      owned.push({
        id: definition.id,
        title: definition.title,
        description: definition.description,
        categoryLabel: "Planner",
        icon: PLANNER_WORKSPACE_ICONS.generic,
        href: `/app/planners/${definition.slug}`,
        accessState: "already-owned",
        availableCtaLabel: "Open Planner",
        ownedCtaLabel: "Open Planner",
        isFree: true,
        priceCents: null,
      });
    }
  }

  return owned;
}

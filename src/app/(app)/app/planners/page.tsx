import { Store } from "lucide-react";
import type { Metadata } from "next";

import { Button, Container, EmptyState, Heading } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { getOwnedPlanners } from "@/lib/owned-planners";
import { getPlannerCategories, getPublishedPlannerDefinitions } from "@/lib/planners";

import { PageHeader } from "../_components/page-header";
import { StoreProductCard } from "../store/_components/store-product-card";
import { PlannerCatalogEmptyState } from "./_components/planner-catalog-empty-state";
import { PlannerTile } from "./_components/planner-tile";

export const metadata: Metadata = {
  title: "Planners",
  robots: { index: false, follow: false },
};

/**
 * "My Planners" - what it says on the label: every planner this user
 * actually has (`getOwnedPlanners()`, composing the Wedding Planner, the
 * Budget Planner, and any generic catalog planner they've started), shown
 * first as real, openable cards - rendered with the Store's own
 * `StoreProductCard` (`getOwnedPlanners()` already shapes each entry as a
 * `StoreListing` with `accessState: "already-owned"`), so a planner reads
 * identically whether it's found here or in the Store, not as two
 * independently-styled card designs for the same underlying product.
 * Below that, the generic, schema-driven catalog
 * (`getPublishedPlannerDefinitions()`) - still genuinely empty today (no
 * real source exists yet), so it only renders its own section once it has
 * something to show, and only falls back to the "nothing published yet"
 * empty state when the user owns nothing at all. A user who owns one or
 * more real planners never sees that empty state - it would read as a
 * contradiction sitting right below their own planner cards.
 *
 * This page used to show *only* the generic catalog, deliberately
 * excluding Wedding/Budget on the theory that they "already have their own
 * sidebar section." In practice that made a page named "My Planners" show
 * "nothing published" to a user who owns and uses one daily - fixed here
 * rather than preserved as a stale architectural distinction nobody
 * visiting this page actually cares about.
 */
export default async function AppPlannersPage() {
  await requireUser();

  const [ownedPlanners, genericPlanners, categories] = await Promise.all([
    getOwnedPlanners(),
    getPublishedPlannerDefinitions(),
    getPlannerCategories(),
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="My Planners" description="Everything available to open in your workspace." />

      {ownedPlanners.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {ownedPlanners.map((listing) => (
            <StoreProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {genericPlanners.length > 0 ? (
        <div className="flex flex-col gap-4">
          {ownedPlanners.length > 0 && (
            <Heading as="h2" size="h4">
              More from the catalog
            </Heading>
          )}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {genericPlanners.map((planner) => (
              <PlannerTile key={planner.id} planner={planner} category={categoryById.get(planner.categoryId)} />
            ))}
          </div>
        </div>
      ) : ownedPlanners.length === 0 ? (
        <PlannerCatalogEmptyState />
      ) : (
        <EmptyState
          icon={Store}
          title="Looking for something new?"
          description="The Store is where every planner appears as it becomes available."
          className="py-10"
          action={<Button href="/app/store">Visit the Store</Button>}
        />
      )}
    </Container>
  );
}

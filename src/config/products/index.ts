import type { ProductLandingConfig } from "@/types/product-landing";

import { budgetPlannerLanding } from "./budget-planner";
import { lifePlannerLanding } from "./life-planner";
import { travelPlannerLanding } from "./travel-planner";
import { weddingPlannerLanding } from "./wedding-planner";

/**
 * Every published Product Landing Page, keyed by slug. Adding a future
 * product means adding one entry here and one new config file next to
 * `wedding-planner.ts`/`budget-planner.ts`/`travel-planner.ts`/
 * `life-planner.ts` - the route and every section component already read
 * through this registry, so nothing else changes.
 */
const productLandingConfigs: Record<string, ProductLandingConfig> = {
  [weddingPlannerLanding.slug]: weddingPlannerLanding,
  [budgetPlannerLanding.slug]: budgetPlannerLanding,
  [travelPlannerLanding.slug]: travelPlannerLanding,
  [lifePlannerLanding.slug]: lifePlannerLanding,
};

export function getProductLandingConfig(slug: string): ProductLandingConfig | undefined {
  return productLandingConfigs[slug];
}

export const productLandingSlugs = Object.keys(productLandingConfigs);

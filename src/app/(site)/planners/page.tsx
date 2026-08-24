import type { Metadata } from "next";

import { getPublishedPlanners } from "@/lib/planner-catalog";

import { CategoryExploration } from "./_components/category-exploration";
import { PlannerCollection } from "./_components/collection";
import { DiscoveryIntroduction } from "./_components/discovery-introduction";
import { ExperiencePreview } from "./_components/experience-preview";
import { PlannersFinalCta } from "./_components/final-cta";
import { PlannersHero } from "./_components/hero";
import { HowToChoose } from "./_components/how-to-choose";
import { FutureVision } from "./_components/future-vision";

export const metadata: Metadata = {
  title: "Planners",
  description:
    "Discover interactive digital planners on Everplans, organized by category and built around the plans you're actually working on.",
};

export default async function PlannersPage() {
  // Real, published planners - the exact same set the authenticated Store
  // shows (`getPublishedPlanners()`'s own comment on why the two can't
  // drift apart). `PlannerCollection`'s populated-grid branch was built
  // for this moment, not left speculative - see that component's own
  // comment.
  const planners = await getPublishedPlanners();

  return (
    <>
      <PlannersHero />
      <DiscoveryIntroduction />
      <PlannerCollection planners={planners} />
      <CategoryExploration />
      <HowToChoose />
      <ExperiencePreview />
      <FutureVision />
      <PlannersFinalCta />
    </>
  );
}

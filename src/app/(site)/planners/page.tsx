import type { Metadata } from "next";

import type { Planner } from "@/types/planner";

import { CategoryExploration } from "./_components/category-exploration";
import { PlannerCollection } from "./_components/collection";
import { DiscoveryControls } from "./_components/discovery-controls";
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

// Always empty today - no planner content source exists yet. Typed as
// Planner[] so PlannerCollection's populated-grid branch is exercised the
// moment a real one does, without this page changing.
const planners: Planner[] = [];

export default function PlannersPage() {
  return (
    <>
      <PlannersHero />
      <DiscoveryIntroduction />
      <DiscoveryControls />
      <PlannerCollection planners={planners} />
      <CategoryExploration />
      <HowToChoose />
      <ExperiencePreview />
      <FutureVision />
      <PlannersFinalCta />
    </>
  );
}

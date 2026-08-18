import type { Metadata } from "next";

import { AboutFinalCta } from "./_components/final-cta";
import { FutureOfEverplans } from "./_components/future";
import { AboutHero } from "./_components/hero";
import { Introduction } from "./_components/introduction";
import { Philosophy } from "./_components/philosophy";
import { PlanningExperience } from "./_components/planning-experience";
import { ScatteredPlanningProblem } from "./_components/problem";
import { Values } from "./_components/values";

export const metadata: Metadata = {
  title: "About",
  description: "Why Everplans exists, the thinking behind the platform, and where it's headed.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <Introduction />
      <ScatteredPlanningProblem />
      <Philosophy />
      <PlanningExperience />
      <FutureOfEverplans />
      <Values />
      <AboutFinalCta />
    </>
  );
}

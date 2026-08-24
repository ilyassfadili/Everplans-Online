import type { Metadata } from "next";

import { Approach } from "./_components/home/approach";
import { AvailableNow } from "./_components/home/available-now";
import { Categories } from "./_components/home/categories";
import { Editorial } from "./_components/home/editorial";
import { FinalCta } from "./_components/home/final-cta";
import { FutureVision } from "./_components/home/future-vision";
import { Hero } from "./_components/home/hero";
import { HowItWorks } from "./_components/home/how-it-works";
import { PlanningPreview } from "./_components/home/planning-preview";
import { Problem } from "./_components/home/problem";
import { Showcase } from "./_components/home/showcase";
import { WhyEverplans } from "./_components/home/why-everplans";

// No `title` here on purpose - the root layout's default ("Everplans", no
// template suffix) is exactly right for the home page. Only the
// description is worth overriding with copy specific to this page.
export const metadata: Metadata = {
  description:
    "Everplans is a digital planning platform built around interactive planners - structured, digital tools for working through a plan, organized by category.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <PlanningPreview />
      <Problem />
      <Approach />
      <HowItWorks />
      <Categories />
      <Showcase />
      <WhyEverplans />
      <Editorial />
      <AvailableNow />
      <FutureVision />
      <FinalCta />
    </>
  );
}

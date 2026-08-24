import type { Metadata } from "next";

import { getCategories } from "@/lib/planner-catalog";

import { CategoryCollection } from "./_components/collection";
import { CategoriesToPlannersConnection } from "./_components/connection";
import { CategoriesFinalCta } from "./_components/final-cta";
import { CategoriesHero } from "./_components/hero";
import { Inspiration } from "./_components/inspiration";
import { CategoryIntroduction } from "./_components/introduction";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse how Everplans organizes interactive planners by category - the part of life or project each one is built for.",
};

export default async function CategoriesPage() {
  // The real category list, each with a real published-planner count - the
  // same source `/planners` reads through (`getPublishedPlanners()`'s own
  // comment), so this page and that one can never disagree about what's
  // actually available.
  const categories = await getCategories();

  return (
    <>
      <CategoriesHero />
      <CategoryIntroduction />
      <CategoryCollection categories={categories} />
      <CategoriesToPlannersConnection />
      <Inspiration />
      <CategoriesFinalCta />
    </>
  );
}

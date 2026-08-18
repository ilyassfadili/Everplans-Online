import type { Metadata } from "next";

import type { Category } from "@/types/planner";

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

// Always empty today - no category data source exists yet.
const categories: Category[] = [];

export default function CategoriesPage() {
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

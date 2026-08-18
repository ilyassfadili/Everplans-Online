import type { Metadata } from "next";

import { getArticles, getFeaturedArticle } from "@/lib/blog";

import { ArticleCollection } from "./_components/collection";
import { BlogFinalCta } from "./_components/final-cta";
import { FeaturedArticle } from "./_components/featured-article";
import { BlogHero } from "./_components/hero";
import { Topics } from "./_components/topics";

export const metadata: Metadata = {
  title: "Blog",
  description: "Practical writing on planning, organization, and working through real projects - from the team building Everplans.",
};

export default async function BlogPage() {
  const [articles, featured] = await Promise.all([getArticles(), getFeaturedArticle()]);

  return (
    <>
      <BlogHero />
      <FeaturedArticle article={featured} />
      <Topics />
      <ArticleCollection articles={articles} />
      <BlogFinalCta />
    </>
  );
}

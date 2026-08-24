import type { MetadataRoute } from "next";

import { productLandingSlugs } from "@/config/products";
import { siteConfig } from "@/config/site";
import { getArticles } from "@/lib/blog";

/*
  /sign-in and /sign-up are deliberately excluded - they already carry
  noindex, and listing a noindex page in the sitemap is contradictory.
  Article URLs come from the same getArticles() the blog listing uses, so
  this stays accurate with zero changes once real articles exist - right
  now that's an empty array, so no fabricated article URLs appear.
*/
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/planners`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/categories`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const productRoutes: MetadataRoute.Sitemap = productLandingSlugs.map((slug) => ({
    url: `${siteConfig.url}/products/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteConfig.url}/blog/${article.slug}`,
    lastModified: article.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...articleRoutes];
}

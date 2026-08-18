import type { Article } from "@/types/article";

/**
 * The entire content data layer, in one place, so swapping in a real
 * source (MDX files, a headless CMS, a Supabase table) later means
 * rewriting these three functions rather than hunting through every
 * component that reads blog content.
 *
 * No content source exists yet, so every function here returns the "no
 * content" answer honestly rather than fabricating articles to fill the
 * page. The listing and article-detail routes are already written against
 * these signatures, so plugging in a real source is a body-swap, not a
 * redesign.
 */

export async function getArticles(): Promise<Article[]> {
  return [];
}

export async function getFeaturedArticle(): Promise<Article | null> {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept to match the real lookup this will become
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return null;
}

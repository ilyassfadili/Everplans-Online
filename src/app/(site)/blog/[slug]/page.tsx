import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, Container, Heading, Link, Prose, Section, Text } from "@/components/ui";
import { getArticleBySlug, getArticles } from "@/lib/blog";

/**
 * No content source exists yet, so this always resolves to notFound() -
 * genuinely, not defensively. The rendering below is real architecture for
 * when an article source exists, not speculative code with nothing behind
 * it: the types, the data-layer seam (src/lib/blog.ts), and this route are
 * all already wired together correctly, waiting on real data.
 */
export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Real per-article metadata once an article exists; no metadata export at
// all when it doesn't, rather than fabricating a title/description for a
// page that's about to 404.
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const publishedDate = new Date(article.publishedAt);

  return (
    <article>
      <Section spacing="sm" background="canvas">
        <Container size="narrow">
          <Link href="/blog" variant="subtle" className="text-body-sm">
            ← Back to Blog
          </Link>

          <div className="mt-6 flex flex-col gap-4">
            <Badge variant="brand" className="w-fit">
              {article.category}
            </Badge>
            <Heading as="h1" size="h1">
              {article.title}
            </Heading>
            <Text size="body-lg" tone="muted">
              {article.excerpt}
            </Text>
            <div className="flex items-center gap-3 text-body-sm text-ink-faint">
              <time dateTime={article.publishedAt}>
                {publishedDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span aria-hidden="true">·</span>
              <span>{article.readingTimeMinutes} min read</span>
            </div>
          </div>

          <Prose html={article.content} className="mt-10 md:mt-12" />
        </Container>
      </Section>

      <Section background="surface-muted" spacing="sm">
        <Container size="narrow" className="text-center">
          <Text size="body-lg" tone="muted">
            Curious what Everplans is building toward?
          </Text>
          <div className="mt-4">
            <Link href="/planners" variant="prominent">
              Explore Planners
            </Link>
          </div>
        </Container>
      </Section>
    </article>
  );
}

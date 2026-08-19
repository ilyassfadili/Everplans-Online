import { Badge, Card, CardDescription, CardHeader, CardTitle, Container, Link, Reveal, Section, Text } from "@/components/ui";
import type { Article } from "@/types/article";

interface FeaturedArticleProps {
  article: Article | null;
}

/**
 * Renders nothing when there's no featured article - which is always,
 * today - rather than a "no featured article" empty state stacked right
 * above the collection's own empty state. Two empty states back to back
 * for the same underlying fact (there's no content) would read as
 * repetitive, not thorough.
 */
export function FeaturedArticle({ article }: FeaturedArticleProps) {
  if (!article) return null;

  return (
    <Section background="surface" spacing="sm">
      <Container>
        <Reveal>
          <Link href={`/blog/${article.slug}`} className="block no-underline">
            <Card variant="interactive" padding="lg">
              <CardHeader>
                <Badge variant="brand">{article.category}</Badge>
                <CardTitle className="mt-3 text-h3">{article.title}</CardTitle>
                <CardDescription className="mt-2">{article.excerpt}</CardDescription>
                <Text size="caption" tone="faint" className="mt-4">
                  {article.readingTimeMinutes} min read
                </Text>
              </CardHeader>
            </Card>
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}

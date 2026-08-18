import { Newspaper } from "lucide-react";

import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Container, Eyebrow, Heading, Link, Section, Text } from "@/components/ui";
import { getArticles } from "@/lib/blog";

/*
  Reads the real content source - src/lib/blog.ts - the same one the Blog
  page itself uses. Nothing here is hardcoded: today getArticles() returns
  an empty array, so the coming-soon panel below renders; the moment real
  articles exist, this section shows them automatically with no changes.
*/
export async function Editorial() {
  const articles = await getArticles();
  const preview = articles.slice(0, 3);

  return (
    <Section background="surface-muted">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>From the blog</Eyebrow>
            <Heading as="h2" className="mt-3">
              Writing on planning, done properly
            </Heading>
          </div>
          <Link href="/blog" variant="prominent" className="text-body-sm">
            Visit the Blog
          </Link>
        </div>

        {preview.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
            <Newspaper className="size-7 text-ink-faint" strokeWidth={1.5} aria-hidden="true" />
            <Text size="body-lg" weight="semibold">
              The first articles are coming
            </Text>
            <Text size="body-sm" tone="muted" className="max-w-sm">
              Everplans’ writing hasn’t been published yet - this is where it will
              appear once it is.
            </Text>
            <Button href="/blog" variant="outline" size="sm" className="mt-2">
              Visit the Blog
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {preview.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="block">
                <Card variant="interactive">
                  <CardHeader>
                    <Badge variant="neutral">{article.category}</Badge>
                    <CardTitle className="mt-3">{article.title}</CardTitle>
                    <CardDescription>{article.excerpt}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

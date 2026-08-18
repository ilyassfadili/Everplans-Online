import { Newspaper } from "lucide-react";

import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Container, EmptyState, Link, Section, Text } from "@/components/ui";
import type { Article } from "@/types/article";

interface ArticleCollectionProps {
  articles: Article[];
}

export function ArticleCollection({ articles }: ArticleCollectionProps) {
  return (
    <Section background="surface">
      <Container>
        {articles.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            titleAs="h2"
            title="Nothing published yet"
            description="Everplans’ writing is just getting started - the first articles haven’t been published. Check back soon, or explore the rest of the platform in the meantime."
            action={
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                <Button href="/planners" size="sm">
                  Explore Planners
                </Button>
                <Button href="/" variant="outline" size="sm">
                  Back to Home
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="block">
                <Card variant="interactive">
                  <CardHeader>
                    <Badge variant="neutral">{article.category}</Badge>
                    <CardTitle className="mt-3">{article.title}</CardTitle>
                    <CardDescription>{article.excerpt}</CardDescription>
                    <Text size="caption" tone="faint" className="mt-4">
                      {article.readingTimeMinutes} min read
                    </Text>
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

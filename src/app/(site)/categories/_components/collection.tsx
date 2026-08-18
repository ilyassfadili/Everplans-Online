import { LayoutGrid } from "lucide-react";

import { Button, Card, CardDescription, CardHeader, CardTitle, Container, EmptyState, Link, Section } from "@/components/ui";
import type { Category } from "@/types/planner";

interface CategoryCollectionProps {
  categories: Category[];
}

/**
 * Same pattern as the Planners page's collection: the empty state is what
 * renders today, and the populated-grid branch is architecture waiting for
 * a real category source, not speculative dead code.
 */
export function CategoryCollection({ categories }: CategoryCollectionProps) {
  return (
    <Section background="canvas">
      <Container>
        {categories.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            titleAs="h2"
            title="Categories are still forming"
            description="Categories take shape as planners are added to Everplans - there's no catalog to group yet. Once the first planners arrive, this is where their categories will appear."
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
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className="block">
                <Card variant="interactive">
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
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

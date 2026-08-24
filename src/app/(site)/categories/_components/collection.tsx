import { ArrowRight, LayoutGrid } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  EmptyState,
  Icon,
  Link,
  Reveal,
  Section,
  Text,
} from "@/components/ui";
import type { Category } from "@/types/planner";

interface CategoryCollectionProps {
  categories: Category[];
}

/**
 * One category tile - icon, name, description, and a real count of what's
 * published in it (`category.plannerCount`, computed fresh by
 * `getCategories()` - never a hand-typed or stale number). A category with
 * at least one real planner is the whole card as a single click target
 * (same whole-card-`Link` pattern as `PlannerCard`/`StoreProductCard`,
 * `no-underline` included from the start this time) through to `/planners`
 * - the catalog where that planner actually lives; a category with none yet
 * stays a plain, non-interactive tile with a "Coming soon" badge instead of
 * a link that would go nowhere real.
 */
function CategoryTile({ category }: { category: Category }) {
  const available = category.plannerCount > 0;

  const body = (
    <Card
      variant={available ? "interactive" : "standard"}
      className="flex h-full flex-col items-center gap-3 p-6 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-accent-subtle text-brand">
        <Icon icon={category.icon} size="lg" />
      </div>
      <CardHeader className="items-center gap-1.5">
        <CardTitle>{category.name}</CardTitle>
        <CardDescription>{category.description}</CardDescription>
      </CardHeader>

      <Badge variant={available ? "brand" : "neutral"} className="mt-1">
        {available ? `${category.plannerCount} planner${category.plannerCount === 1 ? "" : "s"} available` : "Coming soon"}
      </Badge>

      {available && (
        <Text
          size="body-sm"
          weight="medium"
          className="mt-auto flex items-center gap-1.5 pt-2 text-brand transition-transform duration-150 ease-standard group-hover:translate-x-0.5"
        >
          Browse planners
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </Text>
      )}
    </Card>
  );

  if (!available) return body;

  return (
    <Link href="/planners" className="group block h-full no-underline">
      {body}
    </Link>
  );
}

/**
 * Same pattern as the Planners page's collection: the empty state is
 * unreachable today (`categoryDefinitions`, `@/config/categories`, is never
 * empty) but stays in place as the honest fallback this component was
 * always built to handle, not dead speculative code.
 */
export function CategoryCollection({ categories }: CategoryCollectionProps) {
  return (
    <Section background="canvas">
      <Container>
        {categories.length === 0 ? (
          <Reveal>
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
          </Reveal>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={index * 60}>
                <CategoryTile category={category} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

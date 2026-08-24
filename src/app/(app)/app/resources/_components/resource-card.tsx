import { Badge, Card, CardDescription, CardFooter, CardHeader, CardTitle, Text } from "@/components/ui";
import type { Resource } from "@/types/resource";

interface ResourceCardProps {
  resource: Resource;
}

/**
 * A single guide/tip - Phase 2 §3's "clear title, short description,
 * useful metadata, strong readability, clear action," deliberately
 * text-led (no imagery) - "avoid excessive imagery or decorative
 * elements." Not a link yet: there's no real reading destination behind
 * any resource until a real content source exists (see `getResources`'s
 * own comment) - `Resource.slug` is ready for the day a real
 * `/app/resources/[slug]` route exists, but nothing links to it today.
 *
 * No trailing arrow icon in the footer (PROMPT 4's integration audit
 * caught this) - an arrow is a near-universal "this leads somewhere"
 * affordance, and this card doesn't lead anywhere yet. Softening its
 * color to `text-ink-disabled` wasn't enough to stop it implying
 * clickability a plain reading-time label doesn't.
 */
export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{resource.category}</Badge>
        {resource.relatedCategoryName && <Badge variant="brand">{resource.relatedCategoryName}</Badge>}
      </div>
      <CardHeader>
        <CardTitle>{resource.title}</CardTitle>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Text size="caption" tone="faint">
          {resource.readingTimeMinutes} min read
        </Text>
      </CardFooter>
    </Card>
  );
}

import { ArrowRight, NotebookPen } from "lucide-react";

import { Badge, Card, CardDescription, CardFooter, CardHeader, CardTitle, Link, Text } from "@/components/ui";
import type { Planner } from "@/types/planner";

interface PlannerCardProps {
  planner: Planner;
}

/**
 * The reusable presentation for one planner in a catalog grid. Built now,
 * against the `Planner` contract, so the first real planner can render
 * through this component unchanged - nothing here is populated with
 * invented data today because `PlannerCollection` never calls this with
 * an empty catalog. No price, rating, or availability field exists on
 * `Planner` at all, so none can accidentally appear here later either.
 *
 * The visual slot renders a generic mark rather than a photo or mockup -
 * there is no real planner artwork yet, and a repeated stock-looking
 * placeholder image reads as more dishonest than an honest icon does.
 */
export function PlannerCard({ planner }: PlannerCardProps) {
  return (
    <Link href={`/planners/${planner.slug}`} className="group block">
      <Card variant="interactive" padding="none" className="h-full overflow-hidden">
        <div className="flex aspect-[4/3] items-center justify-center border-b border-line-subtle bg-surface-muted">
          <NotebookPen className="size-8 text-ink-disabled" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-3 p-6">
          <Badge variant="brand" className="self-start">
            {planner.categoryName}
          </Badge>
          <CardHeader>
            <CardTitle>{planner.title}</CardTitle>
            <CardDescription>{planner.description}</CardDescription>
          </CardHeader>
          <CardFooter className="mt-0">
            <Text
              size="body-sm"
              weight="medium"
              className="flex items-center gap-1.5 text-brand transition-transform duration-150 ease-standard group-hover:translate-x-0.5"
            >
              Open planner
              <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </Text>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}

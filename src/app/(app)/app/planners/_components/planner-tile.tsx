import { ArrowRight, NotebookPen } from "lucide-react";

import { Badge, Card, CardDescription, CardFooter, CardHeader, CardTitle, Link } from "@/components/ui";
import type { PlannerCategory, PlannerDefinition } from "@/types/planner-definition";

interface PlannerTileProps {
  planner: PlannerDefinition;
  category: PlannerCategory | undefined;
}

/**
 * The in-app counterpart to the public site's `PlannerCard`, not the same
 * component reused: that one is a marketing card built around `Planner`
 * (a flattened, presentational view model), and this one is built around
 * `PlannerDefinition` (the generic domain type) plus its resolved
 * `PlannerCategory`, one lookup up from where the public card's copy
 * lives inline. Two separate components because the shapes genuinely
 * differ - forcing one component to accept either would mean converting
 * the domain type to the view type just to use it, or vice versa,
 * somewhere for no real benefit.
 *
 * Links to `/app/planners/[slug]` the same way the public `PlannerCard`
 * links to its own detail route - but linking here doesn't mean this
 * component decided the viewer may open it. That question belongs
 * entirely to the destination route's own `resolvePlannerAccess` call
 * (`@/lib/planners`); this component's job is only ever "represent one
 * published definition," never "decide access." The route doesn't exist
 * yet (no page renders under `/app/planners/[slug]` today), so this link
 * is inert in practice - discovery never calls this component with real
 * data yet either, since the catalog is empty until a real source exists.
 */
export function PlannerTile({ planner, category }: PlannerTileProps) {
  return (
    <Card variant="standard" padding="none" className="h-full overflow-hidden">
      <div className="flex aspect-[4/3] items-center justify-center border-b border-line-subtle bg-surface-muted">
        <NotebookPen className="size-8 text-ink-disabled" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-3 p-6">
        {category && (
          <Badge variant="brand" className="self-start">
            {category.name}
          </Badge>
        )}
        <CardHeader>
          <CardTitle>{planner.title}</CardTitle>
          <CardDescription>{planner.description}</CardDescription>
        </CardHeader>
        <CardFooter className="mt-0">
          <Link href={`/app/planners/${planner.slug}`} variant="prominent" className="flex items-center gap-1.5">
            Open planner
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
}

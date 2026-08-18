import { Library } from "lucide-react";

import { Button, Container, EmptyState, Section } from "@/components/ui";
import type { Planner } from "@/types/planner";

import { PlannerCard } from "./planner-card";

/**
 * A static grid of reserved slots - the shape the catalog will take, not a
 * loading state. No shimmer, no pulse animation: this isn't "content is on
 * its way this second," it's "this is where content will live." Uniform
 * treatment throughout (no slot styled as "next" or "featured") so nothing
 * here implies a specific timeline or order.
 */
function ReservedSlots() {
  return (
    <div
      aria-hidden="true"
      className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-line bg-surface-muted/40"
        >
          <div className="size-1.5 rounded-full bg-line-strong" />
        </div>
      ))}
    </div>
  );
}

interface PlannerCollectionProps {
  planners: Planner[];
}

/**
 * Renders the empty state today; the grid branch exists so a real planner
 * list can be handed to this same component later without restructuring
 * the page - it's currently unreachable because `planners` is always `[]`,
 * not because the code is untested speculation.
 */
export function PlannerCollection({ planners }: PlannerCollectionProps) {
  return (
    <Section background="surface">
      <Container>
        {planners.length === 0 ? (
          <>
            <ReservedSlots />
            <EmptyState
              icon={Library}
              titleAs="h2"
              title="The planner library is just getting started"
              description="There are no planners published yet - this is where they'll live as they're added. Explore categories to see how the collection will be organized, or check back as new planners arrive."
              action={
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                  <Button href="/categories" size="sm">
                    Explore Categories
                  </Button>
                  <Button href="/about" variant="outline" size="sm">
                    Learn about Everplans
                  </Button>
                </div>
              }
            />
          </>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {planners.map((planner) => (
              <PlannerCard key={planner.id} planner={planner} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

import { Library } from "lucide-react";

import { Button, Container, EmptyState, Reveal, Section } from "@/components/ui";
import type { Planner } from "@/types/planner";

import { DiscoveryControls } from "./discovery-controls";
import { PlannerCard } from "./planner-card";

interface PlannerCollectionProps {
  planners: Planner[];
}

/**
 * Renders the empty state today; the grid branch exists so a real planner
 * list can be handed to this same component later without restructuring
 * the page - it's currently unreachable because `planners` is always `[]`,
 * not because the code is untested speculation.
 *
 * The disabled discovery bar rides along as `beforeContent` only while the
 * catalog is empty - once real planners exist, real (enabled) search/filter
 * controls belong above the populated grid instead, not here.
 */
export function PlannerCollection({ planners }: PlannerCollectionProps) {
  return (
    <Section background="surface">
      <Container>
        {planners.length === 0 ? (
          <Reveal>
            <EmptyState
              icon={Library}
              titleAs="h2"
              beforeContent={<DiscoveryControls />}
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
          </Reveal>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {planners.map((planner, index) => (
              <Reveal key={planner.id} delay={index * 70}>
                <PlannerCard planner={planner} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

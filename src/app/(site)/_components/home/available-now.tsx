import { ArrowRight } from "lucide-react";

import { Badge, Button, Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";
import { getPublishedPlanners } from "@/lib/planner-catalog";

/**
 * The homepage's one concrete "this is real, not vaporware" moment -
 * platform-positioning work needs the platform framing everywhere else on
 * this page (`Hero`, `PlanningPreview`, `Categories`, `FutureVision`), but
 * without at least one genuinely available product named on the page, a
 * visitor has no proof anything is actually live. Reads the same
 * `getPublishedPlanners()` (`@/lib/planner-catalog`) the public Planners
 * page and authenticated Store both read - never a second, hand-typed
 * "what's available" list that could drift out of sync with reality.
 *
 * Deliberately modest, not a card grid: a short line of real product names
 * plus one CTA into the full catalog, not a repeat of `PlannerCard` (Phase
 * 1's own "must never overpower the platform identity" instruction) - the
 * Planners page is where browsing actually happens.
 *
 * Renders nothing if the catalog is genuinely empty - an empty "available
 * now" moment would contradict its own premise, and `FutureVision` (below
 * this section) already owns the "still growing" framing for that state.
 */
export async function AvailableNow() {
  const planners = await getPublishedPlanners();
  if (planners.length === 0) {
    return null;
  }

  return (
    <Section background="surface-muted">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Eyebrow>Available now</Eyebrow>
          <Heading as="h2" className="mt-3">
            Start with a planner that&rsquo;s ready today
          </Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-4 max-w-xl">
            The library is still growing, but these planners are live and ready to use right now.
          </Text>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {planners.map((planner) => (
              <Badge key={planner.id} variant="brand" className="px-3.5 py-1.5 text-body-sm">
                {planner.title}
              </Badge>
            ))}
          </div>

          <div className="mt-8">
            <Button href="/planners" trailingIcon={<ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />}>
              Explore Planners
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

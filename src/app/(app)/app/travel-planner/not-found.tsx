import { Compass } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";

/**
 * Catches unmatched URLs under `/app/travel-planner` - a more specific
 * fallback than `(app)/not-found.tsx`, so a stale or typo'd link lands back
 * in the trip dashboard rather than the generic marketplace home at
 * `/app`, the same reasoning `wedding-planner/not-found.tsx` already
 * establishes.
 */
export default function TravelPlannerNotFound() {
  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        icon={Compass}
        titleAs="h2"
        title="This page doesn’t exist"
        description="The link may be out of date, or the page may have moved."
        className="py-10 sm:py-14 md:py-16"
        action={<Button href="/app/travel-planner">Back to your trip</Button>}
      />
    </Container>
  );
}

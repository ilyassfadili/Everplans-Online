import { Home as HomeIcon } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";

/**
 * Catches unmatched URLs under `/app/home-planner` - a more specific
 * fallback than `(app)/not-found.tsx`, so a stale or typo'd link lands back
 * in the Home Planner workspace rather than the generic marketplace home at
 * `/app`, the same reasoning `travel-planner/not-found.tsx` already
 * establishes.
 */
export default function HomePlannerNotFound() {
  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        icon={HomeIcon}
        titleAs="h2"
        title="This page doesn’t exist"
        description="The link may be out of date, or the page may have moved."
        className="py-10 sm:py-14 md:py-16"
        action={<Button href="/app/home-planner">Back to Home Planner</Button>}
      />
    </Container>
  );
}

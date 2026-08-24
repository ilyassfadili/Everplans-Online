import { Compass } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";

/**
 * Catches unmatched URLs under `/app/wedding-planner` - a more specific
 * fallback than `(app)/not-found.tsx`, so someone deep in the Wedding
 * Planner (a stale vendor/event link, a typo'd URL) lands back in their
 * workspace rather than the generic marketplace home at `/app`, which
 * would otherwise be this shell's only "back" destination and read as a
 * jarring detour out of the product they were actually using.
 */
export default function WeddingPlannerNotFound() {
  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        icon={Compass}
        titleAs="h2"
        title="This page doesn’t exist"
        description="The link may be out of date, or the page may have moved."
        className="py-10 sm:py-14 md:py-16"
        action={<Button href="/app/wedding-planner">Back to your workspace</Button>}
      />
    </Container>
  );
}

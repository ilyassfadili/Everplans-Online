import { Compass } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";

/**
 * Catches unmatched URLs under `/app/budget-planner` - same reasoning as
 * `wedding-planner/not-found.tsx`: a more specific fallback than
 * `(app)/not-found.tsx`, so a stale link lands back in this workspace
 * rather than the generic marketplace home at `/app`.
 */
export default function BudgetPlannerNotFound() {
  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        icon={Compass}
        titleAs="h2"
        title="This page doesn’t exist"
        description="The link may be out of date, or the page may have moved."
        className="py-10 sm:py-14 md:py-16"
        action={<Button href="/app/budget-planner">Back to your workspace</Button>}
      />
    </Container>
  );
}

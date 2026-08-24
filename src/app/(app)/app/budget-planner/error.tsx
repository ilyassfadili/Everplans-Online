"use client";

import { useEffect } from "react";

import { Button, Container, EmptyState } from "@/components/ui";

interface BudgetPlannerErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for `/app/budget-planner/*` - same calm, non-technical
 * shape as `wedding-planner/error.tsx` (never `error.message` rendered
 * verbatim), scoped so "back" returns to this workspace rather than the
 * generic marketplace home.
 */
export default function BudgetPlannerError({ error, reset }: BudgetPlannerErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        titleAs="h2"
        title="Something went wrong"
        description="That didn't load correctly. You can try again, or head back to your workspace."
        className="py-10 sm:py-14 md:py-16"
        action={
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button onClick={reset}>Try again</Button>
            <Button href="/app/budget-planner" variant="outline">
              Back to your workspace
            </Button>
          </div>
        }
      />
    </Container>
  );
}

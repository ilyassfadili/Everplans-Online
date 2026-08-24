"use client";

import { useEffect } from "react";

import { Button, Container, EmptyState } from "@/components/ui";

interface HomePlannerErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for `/app/home-planner/*` - the same calm, non-technical
 * shape as `travel-planner/error.tsx`/`wedding-planner/error.tsx` (never
 * `error.message` rendered verbatim), scoped so "back" returns to the Home
 * Planner's own dashboard rather than the generic marketplace home.
 */
export default function HomePlannerError({ error, reset }: HomePlannerErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        titleAs="h2"
        title="Something went wrong"
        description="That didn't load correctly. You can try again, or head back to Home Planner."
        className="py-10 sm:py-14 md:py-16"
        action={
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button onClick={reset}>Try again</Button>
            <Button href="/app/home-planner" variant="outline">
              Back to Home Planner
            </Button>
          </div>
        }
      />
    </Container>
  );
}

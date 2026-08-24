"use client";

import { useEffect } from "react";

import { Button, Container, EmptyState } from "@/components/ui";
import { APP_HOME_PATH } from "@/config/app";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the `(app)` segment. Must be a Client Component - this
 * is a Next.js file-convention requirement (`error.tsx` renders inside a
 * Client Component boundary the framework generates), the one deliberate
 * exception to this app area otherwise being server-first throughout.
 *
 * Deliberately generic ("Something went wrong") rather than surfacing
 * `error.message`: this boundary catches whatever a future protected page
 * throws, and an unknown thrown error is not a safe thing to render
 * verbatim to the user it happened to. `error.digest` (Next's server-side
 * log correlation ID) is logged, not displayed, for the same reason.
 */
export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        titleAs="h2"
        title="Something went wrong"
        description="That didn't load correctly. You can try again, or head back to your Everplans home."
        className="py-10 sm:py-14 md:py-16"
        action={
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button onClick={reset}>Try again</Button>
            <Button href={APP_HOME_PATH} variant="outline">
              Back to Everplans
            </Button>
          </div>
        }
      />
    </Container>
  );
}

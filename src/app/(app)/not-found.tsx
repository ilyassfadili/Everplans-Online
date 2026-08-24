import { Compass } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";
import { APP_HOME_PATH } from "@/config/app";

/**
 * Catches unmatched URLs under `/app` (and any `notFound()` a future
 * nested route calls without its own local file) - rendered inside the
 * `(app)` layout, so it keeps the authenticated shell's header rather than
 * falling back to `(site)`'s public not-found screen.
 */
export default function AppNotFound() {
  return (
    <Container className="flex flex-1 items-center py-10 sm:py-14 md:py-16">
      <EmptyState
        icon={Compass}
        titleAs="h2"
        title="This page doesn’t exist"
        description="The link may be out of date, or the page may have moved."
        className="py-10 sm:py-14 md:py-16"
        action={
          <Button href={APP_HOME_PATH}>Back to Everplans</Button>
        }
      />
    </Container>
  );
}

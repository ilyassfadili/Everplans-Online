import { Compass } from "lucide-react";

import { Button, Container, EmptyState, Section } from "@/components/ui";

/**
 * Catches both genuinely unmatched URLs and any `notFound()` call from a
 * nested (site) route (e.g. a missing blog article) that doesn't provide
 * its own local not-found.tsx - Next falls back up the tree to this one.
 * Rendered inside the (site) layout, so it keeps the real header and
 * footer rather than a bare, disconnected error screen.
 */
export default function NotFound() {
  return (
    <Section spacing="lg">
      <Container size="narrow">
        <EmptyState
          icon={Compass}
          titleAs="h1"
          title="This page doesn’t exist"
          description="The link may be out of date, or the page may have moved. Here's how to get back on track."
          action={
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <Button href="/">Back to Home</Button>
              <Button href="/planners" variant="outline">
                Explore Planners
              </Button>
            </div>
          }
        />
      </Container>
    </Section>
  );
}

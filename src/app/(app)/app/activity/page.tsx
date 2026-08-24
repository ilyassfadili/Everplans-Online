import { Activity } from "lucide-react";
import type { Metadata } from "next";

import { Button, Container, EmptyState } from "@/components/ui";
import { getRecentActivity } from "@/lib/activity";

import { PageHeader } from "../_components/page-header";
import { ActivityTimeline } from "./_components/activity-timeline";

export const metadata: Metadata = {
  title: "Activity",
  robots: { index: false, follow: false },
};

/**
 * `/app/activity` - real route, real (currently empty) data via
 * `getRecentActivity()`. The empty state explains *why* there's nothing
 * to show (Phase 1 §7: "explaining that activity will appear as the user
 * works inside their planners") rather than looking broken or like an
 * error - the same calm, intentional tone every other empty state in
 * this app already uses.
 *
 * No export/backup control on this page (Phase 1 §8 explicitly allows
 * skipping it rather than inventing fake functionality): there's no real
 * export mechanism anywhere in this codebase to reuse, and building one
 * now - even a UI-only stub - would be exactly the "fake button with
 * nowhere real to go" this whole project has consistently avoided. This
 * page's own doc comment is where that omission is recorded, rather than
 * a dead control in the UI.
 */
export default async function ActivityPage() {
  const items = await getRecentActivity();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Activity" description="A history of what’s happened across your planners." />

      {items.length === 0 ? (
        <EmptyState
          icon={Activity}
          titleAs="h2"
          title="No activity yet"
          description="Once you start working inside a planner, updates like completed sections and progress will show up here."
          className="py-10 sm:py-14 md:py-16"
          action={
            <Button href="/app/store" size="sm">
              Discover Planners
            </Button>
          }
        />
      ) : (
        <ActivityTimeline items={items} />
      )}
    </Container>
  );
}

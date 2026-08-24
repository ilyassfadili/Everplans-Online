import { History } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";

import { PanelHeader } from "./panel-header";

/**
 * Recent activity - a foundation, not a feature (Phase 3: "recent activity
 * foundation"). Nothing in Home Planner writes to an activity log yet, so
 * this is an honest "nothing here yet" rather than fabricated history -
 * the same "do not pretend future features already exist" rule `UpcomingCard`
 * follows.
 */
export function RecentActivityCard() {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={History} title="Recent Activity" />
      <div className="mt-4 flex-1">
        <EmptyState
          title="No recent activity yet"
          description="Changes you make to your home, household, and contacts will show up here soon."
          className="py-8"
        />
      </div>
    </Card>
  );
}

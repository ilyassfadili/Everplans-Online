import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

import { Button, Container, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { getActivePlanners } from "@/lib/dashboard-planners";
import { getResources } from "@/lib/resources";

import { PageHeader } from "../_components/page-header";
import { ResourcesView } from "./_components/resources-view";

export const metadata: Metadata = {
  title: "Resources",
  robots: { index: false, follow: false },
};

/**
 * `/app/resources` - scoped to the workspace's own planners rather than
 * the whole resource catalog (live feedback: "the user will find just
 * the articles about the planners he have"). Gates on `getActivePlanners()`
 * first, not `getResources()`: with zero owned planners there is nothing
 * to filter by at all, and that is a different, more specific empty state
 * ("add a planner first") than "no guides published yet" - `ResourcesView`
 * (and its filter) only renders once there's a real planner to scope to.
 */
export default async function ResourcesPage() {
  await requireUser();

  const [resources, planners] = await Promise.all([getResources(), getActivePlanners()]);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Resources" description="Guides and practical tips for the planners in your workspace." />

      {planners.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          titleAs="h2"
          title="Add a planner to see its guides here"
          description="Resources are tied to the planners in your workspace - once you add one from the Store, its guides and tips will appear on this page."
          action={
            <Button href="/app/store" size="sm">
              Discover Planners
            </Button>
          }
          className="py-10 sm:py-14 md:py-16"
        />
      ) : (
        <ResourcesView resources={resources} planners={planners} />
      )}
    </Container>
  );
}

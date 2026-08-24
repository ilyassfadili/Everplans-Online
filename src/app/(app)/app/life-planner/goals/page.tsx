import type { Metadata } from "next";
import { Target } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";
import { AREA_ICONS } from "@/app/(app)/app/life-planner/areas/_components/area-visuals";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../_components/page-header";
import { GoalCard } from "./_components/goal-card";
import { GoalStatusTabs, type GoalStatusFilter } from "./_components/goal-status-tabs";

export const metadata: Metadata = {
  title: "Goals",
  robots: { index: false, follow: false },
};

interface GoalsPageProps {
  searchParams: Promise<{ status?: string }>;
}

function parseStatusFilter(value: string | undefined): GoalStatusFilter {
  return value === "active" || value === "completed" ? value : "all";
}

/**
 * The dedicated Goals page (Life Planner Prompt 2 Phase 2) - every goal the
 * user is tracking, in `getLifeGoalsForCurrentUser`'s "most relevant first"
 * order, with a light All/Active/Completed filter. Same "confirm the root
 * workspace exists, auto-provision if not, then redirect back" gate the
 * Areas page uses, since this route can be reached directly without ever
 * passing through the dashboard first.
 */
export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;
  const statusFilter = parseStatusFilter(params.status);

  const [goals, areas] = await Promise.all([getLifeGoalsForCurrentUser(), getLifeAreasForCurrentUser()]);
  const areaById = new Map(areas.map((area) => [area.id, area]));

  const filteredGoals = goals.filter((goal) => {
    if (statusFilter === "active") return goal.status !== "completed";
    if (statusFilter === "completed") return goal.status === "completed";
    return true;
  });

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Goals"
        description="What you're working toward, optionally tied back to a Life Area."
        action={
          <Button href="/app/life-planner/goals/new" size="sm">
            New goal
          </Button>
        }
      />

      {goals.length > 0 && <GoalStatusTabs active={statusFilter} />}

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Add your first goal to start tracking what you're working toward."
          action={
            <Button href="/app/life-planner/goals/new" size="sm">
              New goal
            </Button>
          }
        />
      ) : filteredGoals.length === 0 ? (
        <EmptyState title="Nothing here" description="No goals match this filter yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => {
            const area = goal.lifeAreaId ? (areaById.get(goal.lifeAreaId) ?? null) : null;
            return <GoalCard key={goal.id} goal={goal} areaName={area?.name ?? null} areaIcon={area ? AREA_ICONS[area.iconKey] : null} />;
          })}
        </div>
      )}
    </Container>
  );
}

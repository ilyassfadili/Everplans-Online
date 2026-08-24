"use client";

import { BookOpen } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, FormField } from "@/components/ui";
import { Select } from "@/components/ui/form/select";
import type { DashboardPlanner } from "@/types/dashboard-planner";
import type { Resource } from "@/types/resource";

import { ResourceCard } from "./resource-card";

const ALL_PLANNERS_VALUE = "all";

interface ResourcesViewProps {
  resources: Resource[];
  /** Only planners already confirmed non-empty by the page (`ResourcesPage` gates on this itself before rendering this component). */
  planners: DashboardPlanner[];
}

/**
 * Resources scoped to the workspace's own planners, not the whole
 * catalog - a resource only ever shows here if `relatedCategoryName`
 * matches a planner the viewer actually owns (`DashboardPlanner.categoryName`),
 * the same category-name join `AnalyticsView` and `PlannerCard` already
 * rely on for planner identity. No new relation needed: `Resource` and
 * `DashboardPlanner` already agree on category as the shared key.
 *
 * The filter itself follows `AnalyticsView`'s exact pattern (a client
 * `Select` narrowing an already-fetched array, "All" as the default) -
 * only rendered once there's a real choice to make (more than one owned
 * planner); one planner needs no picker, and `ResourcesPage` doesn't
 * render this component at all when there are zero.
 */
export function ResourcesView({ resources, planners }: ResourcesViewProps) {
  const [selectedId, setSelectedId] = useState(ALL_PLANNERS_VALUE);

  const options = [
    { value: ALL_PLANNERS_VALUE, label: "All my planners" },
    ...planners.map((planner) => ({ value: planner.id, label: planner.name })),
  ];

  const selectedPlanner =
    selectedId === ALL_PLANNERS_VALUE ? null : (planners.find((planner) => planner.id === selectedId) ?? null);

  const ownedCategoryNames = useMemo(() => new Set(planners.map((planner) => planner.categoryName)), [planners]);

  const visibleResources = useMemo(() => {
    if (selectedPlanner) {
      return resources.filter((resource) => resource.relatedCategoryName === selectedPlanner.categoryName);
    }
    return resources.filter(
      (resource) => resource.relatedCategoryName && ownedCategoryNames.has(resource.relatedCategoryName),
    );
  }, [resources, selectedPlanner, ownedCategoryNames]);

  return (
    <div className="flex flex-col gap-6">
      {planners.length > 1 && (
        <FormField label="Planner" className="max-w-xs">
          <Select value={selectedId} onValueChange={setSelectedId} options={options} />
        </FormField>
      )}

      {visibleResources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          titleAs="h2"
          title={selectedPlanner ? `No guides for ${selectedPlanner.name} yet` : "No guides for your planners yet"}
          description="Guides and tips about your planners will appear here once they're published."
          className="py-10 sm:py-14 md:py-16"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

import { Card, FormField, Text } from "@/components/ui";
import { Select } from "@/components/ui/form/select";
import type { DashboardPlanner } from "@/types/dashboard-planner";

import { DashboardOverview } from "../../_components/dashboard-overview";
import { PlannerProgress } from "../../_components/planner-progress";

interface AnalyticsViewProps {
  planners: DashboardPlanner[];
}

const ALL_PLANNERS_VALUE = "all";

/**
 * The interactive half of `/app/analytics` - the "All Planners" filter
 * (Dashboard V2 Prompt 3 Phase 1 §2) plus whichever view that selection
 * implies. Client-only because the selection itself is pure UI state with
 * no reason to round-trip through the server or the URL - switching the
 * filter doesn't change what data exists, only which slice of the
 * already-fetched `planners` array is currently shown.
 *
 * "All Planners" reuses `DashboardOverview` exactly as it already renders
 * on `/app` - one aggregate-stats component, not two competing
 * implementations of the same math. Selecting one specific planner swaps
 * to that planner's own `PlannerProgress` plus its section counts - more
 * detail than the compact dashboard card shows, appropriate for a page
 * whose whole purpose is "look closer at your progress."
 *
 * The filter itself is generic (`@/types/dashboard-planner`'s
 * `DashboardPlanner[]`) - nothing here ever branches on a specific
 * planner name or category.
 */
export function AnalyticsView({ planners }: AnalyticsViewProps) {
  const [selectedId, setSelectedId] = useState(ALL_PLANNERS_VALUE);

  const options = [
    { value: ALL_PLANNERS_VALUE, label: "All Planners" },
    ...planners.map((planner) => ({ value: planner.id, label: planner.name })),
  ];

  const selectedPlanner =
    selectedId === ALL_PLANNERS_VALUE ? null : (planners.find((planner) => planner.id === selectedId) ?? null);

  return (
    <div className="flex flex-col gap-6">
      {/* No separate `aria-label` on the Select - FormField already
          associates the visible "Filter" label via `htmlFor`/`id`
          cloning, and an `aria-label` on the control itself would win
          over that association for its accessible name, leaving sighted
          and screen-reader users hearing/seeing different label text for
          the same control (PROMPT 4's integration audit caught this). */}
      <FormField label="Filter" className="max-w-xs">
        <Select value={selectedId} onValueChange={setSelectedId} options={options} />
      </FormField>

      {selectedPlanner ? (
        <Card variant="standard" padding="lg" className="flex flex-col gap-4">
          <Text as="p" size="body-lg" weight="semibold">
            {selectedPlanner.name}
          </Text>
          <PlannerProgress
            percentage={selectedPlanner.progressPercentage}
            completedSections={selectedPlanner.completedSections}
            totalSections={selectedPlanner.totalSections}
          />
          <div className="grid grid-cols-2 gap-4 border-t border-line-subtle pt-4 sm:grid-cols-3">
            <div>
              <Text size="body-lg" weight="semibold" className="tabular-nums">
                {Math.max(0, selectedPlanner.completedSections)}
              </Text>
              <Text size="caption" tone="faint">
                Sections completed
              </Text>
            </div>
            <div>
              <Text size="body-lg" weight="semibold" className="tabular-nums">
                {Math.max(0, selectedPlanner.totalSections - selectedPlanner.completedSections)}
              </Text>
              <Text size="caption" tone="faint">
                Sections remaining
              </Text>
            </div>
            <div>
              <Text size="body-lg" weight="semibold" className="capitalize">
                {selectedPlanner.status.replace("-", " ")}
              </Text>
              <Text size="caption" tone="faint">
                Status
              </Text>
            </div>
          </div>
        </Card>
      ) : (
        <DashboardOverview planners={planners} />
      )}
    </div>
  );
}

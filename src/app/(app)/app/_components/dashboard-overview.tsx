import { ProgressRing, Text } from "@/components/ui";
import type { DashboardPlanner } from "@/types/dashboard-planner";

interface DashboardOverviewProps {
  planners: DashboardPlanner[];
}

/**
 * The "lightweight overview" Phase 2 §5 asks for - three plain figures,
 * not a chart or a second progress system. Deliberately the one place in
 * this dashboard that uses `ProgressRing` (`@/components/ui/progress-ring.tsx`)
 * rather than the linear-bar language every `PlannerCard` uses for its
 * own progress - a ring reading as "the workspace as a whole" and a bar
 * reading as "this one planner" keeps the two genuinely different scopes
 * visually distinct instead of using one language for two different
 * things.
 *
 * "Overall progress" is completed sections over total sections summed
 * across every active planner, not an average of each planner's own
 * percentage - a 2-section planner and a 20-section planner shouldn't
 * carry equal weight in a single combined figure. Every sum defends
 * against a negative/malformed input the same way `PlannerProgress`
 * does, and `totalSections === 0` renders `0%`, never `NaN`.
 *
 * The ring itself is `aria-hidden` (a `ProgressRing` is decorative SVG,
 * see that component) - the adjacent percentage is real, visible text,
 * which is what actually carries the number to anyone who can't read the
 * ring's fill amount, sighted or not.
 */
export function DashboardOverview({ planners }: DashboardOverviewProps) {
  const totalPlanners = planners.length;
  const completedSections = planners.reduce((sum, planner) => sum + Math.max(0, planner.completedSections), 0);
  const totalSections = planners.reduce((sum, planner) => sum + Math.max(0, planner.totalSections), 0);
  const overallPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg border border-line-subtle bg-surface-muted/40 px-5 py-4">
      <div className="flex items-center gap-3">
        <ProgressRing percent={overallPercentage} size={44} strokeWidth={5} />
        <div>
          <Text size="body-lg" weight="semibold" className="tabular-nums">
            {overallPercentage}%
          </Text>
          <Text size="caption" tone="faint">
            Overall progress
          </Text>
        </div>
      </div>

      <div className="hidden h-8 w-px bg-line-subtle sm:block" aria-hidden="true" />

      <div>
        <Text size="body-lg" weight="semibold" className="tabular-nums">
          {totalPlanners}
        </Text>
        <Text size="caption" tone="faint">
          Active planner{totalPlanners === 1 ? "" : "s"}
        </Text>
      </div>

      <div className="hidden h-8 w-px bg-line-subtle sm:block" aria-hidden="true" />

      <div>
        <Text size="body-lg" weight="semibold" className="tabular-nums">
          {completedSections} of {totalSections}
        </Text>
        <Text size="caption" tone="faint">
          Sections completed
        </Text>
      </div>
    </div>
  );
}

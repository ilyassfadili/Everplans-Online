import { Text } from "@/components/ui";

interface PlannerProgressProps {
  percentage: number;
  completedSections: number;
  totalSections: number;
}

/**
 * The Dashboard card's progress row - deliberately the same labeled
 * linear-bar language already established sitewide for "here's concrete
 * progress" (Home's Planning Preview mockup, and the generic Planner
 * Engine's own `PlannerProgress`, `@/components/planner/planner-progress.tsx`,
 * from the runtime work) rather than a new visual pattern invented for
 * cards specifically - one progress language across the product, not two.
 * A `ProgressRing` (`@/components/ui/progress-ring.tsx`) is reserved for
 * `DashboardOverview`'s own aggregate figure instead, so a ring reads as
 * "the workspace as a whole" and a bar reads as "this one planner,"
 * consistently.
 *
 * Every number is clamped/sanitized before it renders - `percentage` from
 * whatever a real future data source eventually computes it as, never
 * trusted to already be a clean 0-100 integer. `totalSections` of `0`
 * (a planner with no sections defined at all) shows "0 of 0 sections"
 * rather than a division artifact, because this component never divides -
 * it only ever displays a percentage that was already computed elsewhere
 * (`DashboardPlanner.progressPercentage`), which is exactly what keeps a
 * malformed `totalSections` from ever producing `NaN`/`Infinity` here.
 */
export function PlannerProgress({ percentage, completedSections, totalSections }: PlannerProgressProps) {
  const safePercentage = Number.isFinite(percentage) ? Math.min(100, Math.max(0, Math.round(percentage))) : 0;
  const safeCompleted = Number.isFinite(completedSections) ? Math.max(0, Math.round(completedSections)) : 0;
  const safeTotal = Number.isFinite(totalSections) ? Math.max(0, Math.round(totalSections)) : 0;

  return (
    <div className="flex items-center gap-3">
      <Text size="caption" tone="muted" className="w-24 shrink-0 whitespace-nowrap">
        {safeTotal > 0 ? `${safeCompleted} of ${safeTotal} sections` : "No sections yet"}
      </Text>
      <div
        role="progressbar"
        aria-valuenow={safePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress"
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-200 ease-standard"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
      <Text size="caption" weight="medium" tone="faint" className="w-9 shrink-0 text-right tabular-nums">
        {safePercentage}%
      </Text>
    </div>
  );
}

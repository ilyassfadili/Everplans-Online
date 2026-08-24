import { Text } from "@/components/ui";
import type { PlannerProgress as PlannerProgressData } from "@/types/planner-runtime";

interface PlannerProgressProps {
  progress: PlannerProgressData;
}

/**
 * A labeled linear bar - the same "Step N of M" + percentage language
 * `ExperiencePreview`'s `PlannerAnatomy` diagram already established as
 * what planner progress looks like on Everplans (see
 * `src/app/(site)/planners/_components/experience-preview.tsx`), now
 * driven by real, derived data instead of a static mockup. Never a plain
 * percentage alone - "step 2 of 5" tells a customer something a bare
 * "40%" doesn't: how many concrete steps remain, not just a fraction.
 *
 * Purely presentational - every number comes from `calculatePlannerProgress`
 * (`@/lib/planner-runtime`), computed fresh from the structure and the
 * current field values, never tracked as separate state here or upstream.
 */
export function PlannerProgress({ progress }: PlannerProgressProps) {
  const stepLabel =
    progress.currentStepIndex >= 0
      ? `Step ${progress.currentStepIndex + 1} of ${progress.totalSteps}`
      : `${progress.totalSteps} steps`;

  return (
    <div className="flex items-center gap-3">
      <Text size="body-sm" tone="muted" className="w-32 shrink-0">
        {stepLabel}
      </Text>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-200 ease-standard"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <Text size="body-sm" weight="medium" tone="faint" className="w-9 shrink-0 text-right tabular-nums">
        {progress.percentage}%
      </Text>
    </div>
  );
}

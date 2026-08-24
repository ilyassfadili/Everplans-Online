interface HabitProgressBarProps {
  completed: number;
  target: number;
}

/**
 * A single-row filled/unfilled bar - `completedInPeriod` out of
 * `targetInPeriod`, capped visually at 100% even if a user somehow logs
 * more than the target within one period. Deliberately just a bar, not a
 * calendar heatmap or a ring - "no excessive analytics/gamification" (Phase
 * 3's own instruction) keeps this to the smallest useful visual, paired
 * with `describeHabitProgress`'s own plain-language text everywhere this
 * appears.
 */
export function HabitProgressBar({ completed, target }: HabitProgressBarProps) {
  const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={target}>
      <div className="h-full rounded-full bg-brand transition-[width] duration-200 ease-standard" style={{ width: `${percent}%` }} />
    </div>
  );
}

import { ListChecks } from "lucide-react";

import { Card, Text } from "@/components/ui";

import { PanelHeader } from "./panel-header";

interface ChecklistProgressCardProps {
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface RingSegment {
  value: number;
  className: string;
}

/** A stacked-arc SVG donut - completed and in-progress each get their own arc; the untouched base ring stands in for "to do", so the unfilled track itself carries meaning instead of a third drawn arc. */
function ProgressDonut({ segments, total, size = 108, strokeWidth = 12 }: { segments: RingSegment[]; total: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? Math.round((segments[0]!.value / total) * 100) : 0;

  let cumulative = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-surface-muted" />
        {total > 0 &&
          segments.map((segment, index) => {
            if (segment.value === 0) return null;
            const length = (segment.value / total) * circumference;
            const dashoffset = circumference - cumulative;
            cumulative += length;
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={dashoffset}
                className={segment.className}
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-h3 leading-none text-ink">{percent}%</span>
        <span className="mt-1 text-caption text-ink-faint">Completed</span>
      </div>
    </div>
  );
}

// Emotional framing paired with the real number below it, never replacing
// it (Phase 2 §2: "combine both"). Tiered so the same line doesn't show at
// 0% and 100% alike.
function progressMessage(percent: number, total: number): string {
  if (total === 0) return "Every wedding starts with a first step.";
  if (percent >= 100) return "Every box checked - you did this together.";
  if (percent >= 50) return "You're getting closer, together.";
  return "You're making progress, together.";
}

function LegendRow({ dotClassName, label, count }: { dotClassName: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`size-2.5 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" />
      <Text size="body-sm" tone="muted" className="flex-1">
        {label}
      </Text>
      <Text size="body-sm" weight="semibold" className="text-ink">
        {count}
      </Text>
    </div>
  );
}

/**
 * The dashboard's checklist progress, broken out by all three real task
 * states (`WeddingPlanningStatus`) rather than just "done vs. not" - the
 * data already distinguishes "in progress" from "not started"
 * (`WeddingTask.status`), so the ring shows that real split instead of
 * collapsing it into one binary percentage.
 */
export function ChecklistProgressCard({ completed, inProgress, notStarted }: ChecklistProgressCardProps) {
  const total = completed + inProgress + notStarted;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) {
    return (
      <Card variant="standard" padding="lg" className="flex h-full flex-col">
        <PanelHeader icon={ListChecks} title="Checklist Progress" />
        <Text tone="muted" className="mt-2">
          {progressMessage(percent, total)}
        </Text>
        <Text tone="muted" className="mt-1">
          Add your first task on the checklist to start tracking how your planning is coming along.
        </Text>
      </Card>
    );
  }

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={ListChecks} title="Checklist Progress" />
      <Text size="body-sm" tone="muted" className="mt-1">
        {progressMessage(percent, total)}
      </Text>
      <div className="mt-4 flex flex-1 items-center gap-6">
        <ProgressDonut segments={[{ value: completed, className: "stroke-brand" }, { value: inProgress, className: "stroke-brand/45" }]} total={total} />
        <div className="flex flex-1 flex-col gap-3">
          <LegendRow dotClassName="bg-brand" label="Completed" count={completed} />
          <LegendRow dotClassName="bg-brand/45" label="In Progress" count={inProgress} />
          <LegendRow dotClassName="bg-surface-muted ring-1 ring-inset ring-line" label="To Do" count={notStarted} />
        </div>
      </div>
    </Card>
  );
}

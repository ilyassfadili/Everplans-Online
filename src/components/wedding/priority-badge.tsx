import { Badge } from "@/components/ui";
import type { WeddingTaskPriority } from "@/types/wedding";

const PRIORITY_LABEL: Record<WeddingTaskPriority, string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
};

// Calm, not alarming (Phase 4: "Do not use alarming or stressful visual
// design") - `high` gets `warning`'s amber, never `error`'s red. A task's
// priority is a planning signal, not a fault state.
const PRIORITY_VARIANT: Record<WeddingTaskPriority, "outline" | "neutral" | "warning"> = {
  low: "outline",
  medium: "neutral",
  high: "warning",
};

interface PriorityBadgeProps {
  priority: WeddingTaskPriority;
  className?: string;
}

/** Shared between the checklist and the dashboard's task previews - one consistent priority treatment everywhere a task appears. */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className={className}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}

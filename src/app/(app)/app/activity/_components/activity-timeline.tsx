import { CheckCircle2, PenLine, PlayCircle, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Icon, Text } from "@/components/ui";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ActivityEventType, ActivityItem } from "@/types/activity";

interface ActivityTimelineProps {
  items: ActivityItem[];
}

/** One icon per generic event type - purely visual grouping, never a planner-specific meaning. */
const eventIcon: Record<ActivityEventType, LucideIcon> = {
  "planner-started": PlayCircle,
  "section-completed": CheckCircle2,
  "progress-updated": TrendingUp,
  "planner-resumed": RefreshCw,
  "planner-completed": Sparkles,
  "data-updated": PenLine,
};

/**
 * The reusable timeline presentation for `ActivityItem[]` (Phase 1 §6) -
 * a plain vertical list with a leading icon per event type, not a
 * chart or a table. Stays readable at any length because each row is
 * self-contained (icon, description, planner name, relative time) rather
 * than relying on column alignment that would break as descriptions vary
 * in length.
 *
 * Timestamps go through the same `formatRelativeTime` (`@/lib/format-relative-time`)
 * `PlannerCard` already uses - one relative-time formatter for the whole
 * app, not a second one reinvented here.
 */
export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <ul className="flex flex-col divide-y divide-line-subtle border-y border-line-subtle">
      {items.map((item) => {
        const relativeTime = formatRelativeTime(item.occurredAt);
        return (
          <li key={item.id} className="flex items-start gap-4 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
              <Icon icon={eventIcon[item.type]} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <Text size="body-sm" className="text-ink">
                {item.description}
                {item.plannerName && <span className="text-ink-muted"> · {item.plannerName}</span>}
              </Text>
              {relativeTime && (
                <Text size="caption" tone="faint" className="mt-0.5">
                  {relativeTime}
                </Text>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

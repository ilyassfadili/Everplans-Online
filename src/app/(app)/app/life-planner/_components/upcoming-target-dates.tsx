import { CalendarClock } from "lucide-react";

import { Card, Heading, Icon, Link, Text } from "@/components/ui";
import type { UpcomingLifePlanningDate } from "@/lib/life-planner/life-goal-planning";

import { formatGoalDate } from "../goals/_components/goal-visuals";

interface UpcomingTargetDatesProps {
  items: UpcomingLifePlanningDate[];
}

/**
 * The dashboard's own small "Upcoming target dates" mini-list (Phase 3 §6) -
 * every goal target date and milestone target date within the next ~30
 * days, soonest first, capped at 5
 * (`getUpcomingTargetDatesForCurrentUser`, `@/lib/life-planner/life-goal-planning`).
 * Deliberately small and unobtrusive - a plain list of rows, not a second
 * dense card grid like `GoalsSection` - and the caller omits this component
 * entirely when `items` is empty, since nothing upcoming isn't worth an
 * empty state of its own for something this secondary.
 */
export function UpcomingTargetDates({ items }: UpcomingTargetDatesProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center gap-2">
        <Icon icon={CalendarClock} size="sm" className="text-ink-faint" />
        <Heading as="h2" size="h4">
          Upcoming target dates
        </Heading>
      </div>

      <div className="mt-3 flex flex-col divide-y divide-line-subtle">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            variant="inline"
            className="flex items-center justify-between gap-3 py-2.5 text-ink no-underline hover:text-ink first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Text size="body-sm" weight="medium" className="truncate text-ink">
                {item.label}
              </Text>
              {item.kind === "milestone" && item.goalTitle && (
                <Text size="body-sm" tone="faint" className="truncate">
                  {item.goalTitle}
                </Text>
              )}
            </div>
            <Text size="body-sm" tone="muted" className="shrink-0">
              {formatGoalDate(item.targetDate)}
            </Text>
          </Link>
        ))}
      </div>
    </Card>
  );
}

import type { LucideIcon } from "lucide-react";

import { Badge, Card, Icon, Link, Text } from "@/components/ui";
import type { LifeGoal } from "@/types/life-planner";

import { formatGoalDate, PRIORITY_BADGE, PRIORITY_LABEL, STATUS_BADGE, STATUS_LABEL } from "./goal-visuals";

interface GoalCardProps {
  goal: LifeGoal;
  /** `null` when the goal isn't filed under an area, or when its area was since removed (`life_area_id` sets `null` on delete). */
  areaName: string | null;
  areaIcon: LucideIcon | null;
}

/**
 * One Life Goal card for the full Goals list (Phase 2 §4) - links straight
 * to the goal's own detail page rather than offering inline edit like
 * `AreaCard`, since a goal carries enough fields (status, progress, target
 * date, notes) that a dedicated page reads better than an expanding card.
 */
export function GoalCard({ goal, areaName, areaIcon: AreaIcon }: GoalCardProps) {
  const targetDateLabel = formatGoalDate(goal.targetDate);

  return (
    <Link href={`/app/life-planner/goals/${goal.id}`} variant="inline" className="block text-ink no-underline hover:text-ink">
      <Card variant="interactive" padding="lg" className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Text as="p" weight="semibold" className="text-ink">
            {goal.title}
          </Text>
          <Badge variant={STATUS_BADGE[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
        </div>

        {areaName && (
          <div className="flex items-center gap-1.5 text-ink-muted">
            {AreaIcon && <Icon icon={AreaIcon} size="sm" />}
            <Text size="body-sm" tone="muted">
              {areaName}
            </Text>
          </div>
        )}

        {goal.description && (
          <Text size="body-sm" tone="muted" className="line-clamp-2">
            {goal.description}
          </Text>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-standard" style={{ width: `${goal.progress}%` }} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Badge variant={PRIORITY_BADGE[goal.priority]}>{PRIORITY_LABEL[goal.priority]}</Badge>
            <Text size="body-sm" tone="faint">
              {goal.progress}%{targetDateLabel ? ` · ${targetDateLabel}` : ""}
            </Text>
          </div>
        </div>
      </Card>
    </Link>
  );
}

import { ArrowRight } from "lucide-react";

import { AREA_ICONS } from "@/app/(app)/app/life-planner/areas/_components/area-visuals";
import { Badge, Button, Card, EmptyState, Heading, Icon, Link, Text } from "@/components/ui";
import type { LifeArea, LifeGoal } from "@/types/life-planner";

import { formatGoalDate, STATUS_BADGE, STATUS_LABEL } from "../goals/_components/goal-visuals";

interface GoalsSectionProps {
  goals: LifeGoal[];
  areas: LifeArea[];
}

/**
 * The dashboard's own compact Goals preview (Phase 2 §5) - the real system
 * that replaces the "Goals" tile `FutureModulesSection` used to render as a
 * placeholder. Up to 3 not-yet-completed goals, in `getLifeGoalsForCurrentUser`'s
 * own "most relevant first" order, each a small card with title, area,
 * status, and a progress bar - a glanceable summary, not a second place to
 * edit goals (the same "preview, not editor" role `LifeAreasPreview` plays
 * for Life Areas).
 */
export function GoalsSection({ goals, areas }: GoalsSectionProps) {
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const activeGoals = goals.filter((goal) => goal.status !== "completed").slice(0, 3);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Goals
        </Heading>
        {goals.length > 0 && (
          <Link href="/app/life-planner/goals" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Add your first goal to start tracking what you're working toward."
          action={
            <Button href="/app/life-planner/goals/new" size="sm">
              New goal
            </Button>
          }
          className="mt-4 py-6"
        />
      ) : activeGoals.length === 0 ? (
        <Text size="body-sm" tone="muted" className="mt-3">
          Every goal is marked complete - view all to see them or add a new one.
        </Text>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {activeGoals.map((goal) => {
            const area = goal.lifeAreaId ? (areaById.get(goal.lifeAreaId) ?? null) : null;
            const AreaIcon = area ? AREA_ICONS[area.iconKey] : null;
            const targetDateLabel = formatGoalDate(goal.targetDate);

            return (
              <Link key={goal.id} href={`/app/life-planner/goals/${goal.id}`} variant="inline" className="block text-ink no-underline hover:text-ink">
                <div className="flex h-full flex-col gap-2.5 rounded-lg border border-line-subtle bg-surface p-4 transition-colors duration-150 ease-standard hover:border-line">
                  <div className="flex items-start justify-between gap-2">
                    <Text size="body-sm" weight="semibold" className="text-ink">
                      {goal.title}
                    </Text>
                    <Badge variant={STATUS_BADGE[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
                  </div>

                  {area && (
                    <div className="flex items-center gap-1.5 text-ink-muted">
                      {AreaIcon && <Icon icon={AreaIcon} size="sm" />}
                      <Text size="body-sm" tone="muted">
                        {area.name}
                      </Text>
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-1.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${goal.progress}%` }} />
                    </div>
                    <Text size="body-sm" tone="faint">
                      {goal.progress}%{targetDateLabel ? ` · ${targetDateLabel}` : ""}
                    </Text>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

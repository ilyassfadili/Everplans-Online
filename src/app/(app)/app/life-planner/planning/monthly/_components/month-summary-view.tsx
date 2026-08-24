import { Badge, Card, Heading, Text } from "@/components/ui";
import { STATUS_BADGE, STATUS_LABEL, formatGoalDate } from "@/app/(app)/app/life-planner/goals/_components/goal-visuals";
import { formatTaskDate, isTaskOverdue } from "@/app/(app)/app/life-planner/tasks/_components/task-visuals";
import type { MonthSummary } from "@/lib/life-planner/life-planning";

interface MonthSummaryViewProps {
  summary: MonthSummary;
}

/**
 * The Monthly Planning page's own read-only "This month" summary (Phase 1
 * §5) - the same "curated view over existing data, never an editor" role
 * `WeekSummaryView` plays one grain down. Three plain lists: tasks due this
 * month, active goals with a target date landing this month, and every
 * still-active goal regardless of target date (`allActiveGoals`, a superset
 * of the target-dated list) - no habits/routines section at this grain,
 * since "today" isn't a meaningful concept within a month-wide view the way
 * it is for a single week.
 */
export function MonthSummaryView({ summary }: MonthSummaryViewProps) {
  const { tasksDueThisMonth, activeGoalsWithTargetDatesThisMonth, allActiveGoals } = summary;

  return (
    <div className="flex flex-col gap-4">
      <Heading as="h2" size="h4">
        This month
      </Heading>

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="standard" padding="lg">
          <Text size="body-sm" weight="semibold" className="text-ink">
            Tasks due this month
          </Text>
          {tasksDueThisMonth.length === 0 ? (
            <Text size="body-sm" tone="muted" className="mt-3">
              Nothing due this month.
            </Text>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {tasksDueThisMonth.map((task) => {
                const dueDateLabel = formatTaskDate(task.dueDate);
                return (
                  <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface p-3">
                    <Text size="body-sm" className="truncate text-ink">
                      {task.title}
                    </Text>
                    {dueDateLabel && (
                      <Text size="body-sm" className={isTaskOverdue(task) ? "shrink-0 text-error" : "shrink-0 text-ink-faint"}>
                        {dueDateLabel}
                      </Text>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card variant="standard" padding="lg">
          <Text size="body-sm" weight="semibold" className="text-ink">
            Goals due this month
          </Text>
          {activeGoalsWithTargetDatesThisMonth.length === 0 ? (
            <Text size="body-sm" tone="muted" className="mt-3">
              No goals targeted for this month.
            </Text>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {activeGoalsWithTargetDatesThisMonth.map((goal) => {
                const targetDateLabel = formatGoalDate(goal.targetDate);
                return (
                  <div key={goal.id} className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface p-3">
                    <Text size="body-sm" className="truncate text-ink">
                      {goal.title}
                    </Text>
                    {targetDateLabel && (
                      <Text size="body-sm" tone="faint" className="shrink-0">
                        {targetDateLabel}
                      </Text>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card variant="standard" padding="lg">
        <Text size="body-sm" weight="semibold" className="text-ink">
          All active goals
        </Text>
        {allActiveGoals.length === 0 ? (
          <Text size="body-sm" tone="muted" className="mt-3">
            No active goals right now.
          </Text>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {allActiveGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface p-3">
                <Text size="body-sm" className="truncate text-ink">
                  {goal.title}
                </Text>
                <Badge variant={STATUS_BADGE[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

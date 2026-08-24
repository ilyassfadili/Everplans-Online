import { Badge, Card, Heading, Text } from "@/components/ui";
import { TodaysHabitsSection } from "@/app/(app)/app/life-planner/_components/todays-habits-section";
import { TodaysRoutinesSection } from "@/app/(app)/app/life-planner/_components/todays-routines-section";
import { STATUS_BADGE, STATUS_LABEL } from "@/app/(app)/app/life-planner/goals/_components/goal-visuals";
import { formatTaskDate, isTaskOverdue } from "@/app/(app)/app/life-planner/tasks/_components/task-visuals";
import type { WeekSummary } from "@/lib/life-planner/life-planning";

interface WeekSummaryViewProps {
  summary: WeekSummary;
  /** Today's local date as `YYYY-MM-DD`, computed server-side (`page.tsx`) - threaded through to `TodaysHabitsSection`/`TodaysRoutinesSection` so their completion toggles stamp the same day the server used to compute `summary.habitsToday`/`summary.routineGroupsToday`, the same reasoning those components' own `today` prop already documents. */
  today: string;
}

/**
 * The Weekly Planning page's own read-only "Upcoming this week" summary
 * (Phase 1 §4) - never an editor, purely a curated view over data that
 * already lives in Tasks/Goals/Habits/Routines. Tasks due this week and
 * active goals are rendered as plain compact rows here; today's habits and
 * routines (only shown when today actually falls within this week -
 * `summary.todayInWeek`) reuse the dashboard's own
 * `TodaysHabitsSection`/`TodaysRoutinesSection` outright rather than a
 * third rendering of the same data, so their completion toggles keep
 * working exactly as they do on the dashboard.
 */
export function WeekSummaryView({ summary, today }: WeekSummaryViewProps) {
  const { tasksDueThisWeek, activeGoals, habitsToday, routineGroupsToday, todayInWeek } = summary;

  return (
    <div className="flex flex-col gap-4">
      <Heading as="h2" size="h4">
        Upcoming this week
      </Heading>

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="standard" padding="lg">
          <Text size="body-sm" weight="semibold" className="text-ink">
            Tasks due this week
          </Text>
          {tasksDueThisWeek.length === 0 ? (
            <Text size="body-sm" tone="muted" className="mt-3">
              Nothing due this week.
            </Text>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {tasksDueThisWeek.map((task) => {
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
            Active goals
          </Text>
          {activeGoals.length === 0 ? (
            <Text size="body-sm" tone="muted" className="mt-3">
              No active goals right now.
            </Text>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {activeGoals.map((goal) => (
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

      {todayInWeek && (habitsToday.length > 0 || routineGroupsToday.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <TodaysHabitsSection habitsProgress={habitsToday} today={today} />
          <TodaysRoutinesSection groups={routineGroupsToday} today={today} />
        </div>
      )}
    </div>
  );
}

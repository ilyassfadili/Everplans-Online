import type { Metadata } from "next";
import { ListTodo } from "lucide-react";

import { Container, EmptyState } from "@/components/ui";
import { AREA_ICONS } from "@/app/(app)/app/life-planner/areas/_components/area-visuals";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getTasksForCurrentUser } from "@/lib/life-planner/life-tasks";

import { PageHeader } from "../../_components/page-header";
import { QuickAddTaskForm } from "./_components/quick-add-task-form";
import { TaskFilterTabs, type TaskFilter } from "./_components/task-filter-tabs";
import { TaskRow } from "./_components/task-row";
import { isTaskOverdue, isTaskDueToday, todayIso } from "./_components/task-visuals";

export const metadata: Metadata = {
  title: "Tasks",
  robots: { index: false, follow: false },
};

interface TasksPageProps {
  searchParams: Promise<{ filter?: string }>;
}

function parseFilter(value: string | undefined): TaskFilter {
  return value === "today-overdue" || value === "upcoming" || value === "completed" ? value : "all";
}

/**
 * The dedicated Tasks page (Life Planner Prompt 3 Phase 1) - every
 * non-archived task the user is tracking, in `getTasksForCurrentUser`'s
 * "most urgent first" order, with an All/Today & Overdue/Upcoming/Completed
 * filter. Same "confirm the root workspace exists, auto-provision if not,
 * then redirect back" gate the Goals/Areas pages use, since this route can
 * be reached directly without ever passing through the dashboard first.
 */
export default async function TasksPage({ searchParams }: TasksPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;
  const filter = parseFilter(params.filter);

  const [tasks, areas, goals] = await Promise.all([
    getTasksForCurrentUser(),
    getLifeAreasForCurrentUser(),
    getLifeGoalsForCurrentUser(),
  ]);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const goalById = new Map(goals.map((goal) => [goal.id, goal]));

  const today = todayIso();
  const filteredTasks = tasks.filter((task) => {
    if (filter === "today-overdue") return task.status !== "completed" && task.dueDate !== null && (isTaskOverdue(task) || isTaskDueToday(task));
    if (filter === "upcoming") return task.status !== "completed" && task.dueDate !== null && task.dueDate > today;
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Tasks" description="Everything on your plate, whether or not it's tied to a goal or a Life Area." />

      <QuickAddTaskForm />

      {tasks.length > 0 && <TaskFilterTabs active={filter} />}

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Add your first task above to start keeping track of what's next."
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState title="Nothing here" description="No tasks match this filter yet." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredTasks.map((task) => {
            const area = task.lifeAreaId ? (areaById.get(task.lifeAreaId) ?? null) : null;
            const goal = task.goalId ? (goalById.get(task.goalId) ?? null) : null;
            return (
              <TaskRow
                key={task.id}
                task={task}
                areaName={area?.name ?? null}
                areaIcon={area ? AREA_ICONS[area.iconKey] : null}
                goalTitle={goal?.title ?? null}
              />
            );
          })}
        </div>
      )}
    </Container>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getTaskById } from "@/lib/life-planner/life-tasks";

import { TaskDetailView } from "./_components/task-detail-view";

interface TaskDetailPageProps {
  params: Promise<{ taskId: string }>;
}

export const metadata: Metadata = {
  title: "Task",
  robots: { index: false, follow: false },
};

/**
 * One Life Task's detail/edit view (Phase 1 §4) - the destination every
 * task row's edit action links to. `getTaskById` is already owner-scoped
 * (see that function's own comment), so a `null` result covers both
 * "doesn't exist" and "belongs to someone else" with the same honest 404 -
 * the same shape `GoalDetailPage` already establishes for a goal one
 * product level up.
 */
export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  await requireLifePlanForCurrentUser();

  const task = await getTaskById(taskId);
  if (!task) {
    notFound();
  }

  const [areas, goals] = await Promise.all([getLifeAreasForCurrentUser(), getLifeGoalsForCurrentUser()]);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/life-planner/tasks" variant="subtle" className="text-body-sm">
        ← All tasks
      </Link>
      <TaskDetailView task={task} areas={areas} goals={goals} />
    </Container>
  );
}

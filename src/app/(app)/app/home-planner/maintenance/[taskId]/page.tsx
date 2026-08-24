import { Check, Pause, Pencil, Play, Repeat, RotateCcw, Trash2, Wrench } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Badge, Button, Card, Container, Eyebrow, Heading, Icon, Text } from "@/components/ui";
import { getMaintenanceCategoryLabel } from "@/components/home-planner/maintenance-category-options";
import { getMaintenancePriorityLabel } from "@/components/home-planner/maintenance-priority-options";
import { MaintenanceStatusBadge } from "@/components/home-planner/maintenance-status-badge";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getMaintenanceTaskById } from "@/lib/home-planner/maintenance";
import { calculateMaintenanceStatus } from "@/lib/home-planner/maintenance-status";
import { getRecurrenceFrequencyLabel, previewUpcomingOccurrences } from "@/lib/home-planner/recurrence";
import { getRoomById } from "@/lib/home-planner/rooms";

import { completeTaskAction, deleteMaintenanceTaskAction, reopenTaskAction, setRecurrenceActiveAction } from "../actions";

interface TaskDetailPageProps {
  params: Promise<{ taskId: string }>;
}

export const metadata: Metadata = {
  title: "Task Details",
  robots: { index: false, follow: false },
};

/** Task details (Phase 1: "provide task information, task metadata, and relevant task actions"). */
export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const task = await getMaintenanceTaskById(home.id, taskId);

  if (!task) {
    notFound();
  }

  const room = task.roomId ? await getRoomById(home.id, task.roomId) : null;
  const status = calculateMaintenanceStatus(task, new Date());
  const isCompleted = status === "completed";

  const completeAction = isCompleted ? reopenTaskAction.bind(null, task.id) : completeTaskAction.bind(null, task.id);
  const deleteAction = deleteMaintenanceTaskAction.bind(null, task.id);
  const toggleRecurrenceAction = setRecurrenceActiveAction.bind(null, task.id, !task.recurrenceActive);

  // A purely illustrative preview, never a guarantee (`previewUpcomingOccurrences`'s
  // own comment) - real occurrences are only ever generated one at a time,
  // when the current one is completed.
  const upcomingPreview = task.recurrenceFrequency
    ? previewUpcomingOccurrences(task.dueDate ?? new Date().toISOString().slice(0, 10), task.recurrenceFrequency, task.recurrenceIntervalDays)
    : [];

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
            <Icon icon={Wrench} size="md" />
          </div>
          <div>
            <Eyebrow tone="brand">Home Planner</Eyebrow>
            <Heading as="h1" size="h2" className="mt-2">
              {task.name}
            </Heading>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <MaintenanceStatusBadge status={status} />
              <Badge variant="neutral">{getMaintenanceCategoryLabel(task.category)}</Badge>
              <Badge variant="neutral">{getMaintenancePriorityLabel(task.priority)} priority</Badge>
              {task.recurrenceFrequency && (
                <Badge variant="brand">
                  <Icon icon={Repeat} size="sm" />
                  {getRecurrenceFrequencyLabel(task.recurrenceFrequency)}
                  {!task.recurrenceActive && " (paused)"}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            href={`/app/home-planner/maintenance/${task.id}/edit`}
            variant="outline"
            leadingIcon={<Icon icon={Pencil} size="sm" />}
          >
            Edit
          </Button>
          <form action={deleteAction}>
            <Button type="submit" variant="outline" leadingIcon={<Icon icon={Trash2} size="sm" />}>
              Delete
            </Button>
          </form>
        </div>
      </div>

      <form action={completeAction}>
        <Button type="submit" leadingIcon={<Icon icon={isCompleted ? RotateCcw : Check} size="sm" />}>
          {isCompleted ? "Reopen task" : "Mark complete"}
        </Button>
      </form>

      <Card variant="standard" padding="lg" className="flex flex-col gap-5">
        <div>
          <Text size="body-sm" tone="muted">
            Room
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {room?.name ?? "Not assigned"}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Due date
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {task.dueDate ?? "Not set"}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Description
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {task.description || "Nothing added yet"}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Notes
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {task.notes || "Nothing added yet"}
          </Text>
        </div>
      </Card>

      {task.recurrenceFrequency && (
        <Card variant="standard" padding="lg" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text size="body" weight="medium" className="text-ink">
              Recurs {getRecurrenceFrequencyLabel(task.recurrenceFrequency).toLowerCase()}
            </Text>
            <form action={toggleRecurrenceAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                leadingIcon={<Icon icon={task.recurrenceActive ? Pause : Play} size="sm" />}
              >
                {task.recurrenceActive ? "Pause recurrence" : "Resume recurrence"}
              </Button>
            </form>
          </div>
          {!task.recurrenceActive && (
            <Text size="body-sm" tone="muted">
              Recurrence is paused - completing this task won&rsquo;t create a next occurrence.
            </Text>
          )}
          {upcomingPreview.length > 0 && (
            <div>
              <Text size="body-sm" tone="muted">
                Upcoming occurrences (estimated)
              </Text>
              <ul className="mt-1 flex flex-col gap-0.5">
                {upcomingPreview.map((date) => (
                  <Text key={date} as="li" size="body-sm" className="text-ink">
                    {date}
                  </Text>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <Button href="/app/home-planner/maintenance" variant="ghost" className="self-start">
        Back to maintenance
      </Button>
    </Container>
  );
}

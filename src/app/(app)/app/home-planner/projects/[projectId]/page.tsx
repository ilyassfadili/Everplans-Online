import { Hammer, Pencil, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, Button, Card, Container, Eyebrow, Heading, Icon, ProgressRing, Text } from "@/components/ui";
import { getProjectCategoryLabel } from "@/components/home-planner/project-category-options";
import { getProjectStatusLabel, getProjectStatusVariant } from "@/components/home-planner/project-status-options";
import { formatMoney } from "@/lib/home-planner/format-currency";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";
import { calculateProjectProgress } from "@/lib/home-planner/project-progress";
import { getTasksForProject } from "@/lib/home-planner/project-tasks";
import { getProjectById } from "@/lib/home-planner/projects";
import { getRoomById } from "@/lib/home-planner/rooms";

import { deleteProjectAction } from "../actions";
import { ProjectTaskList } from "./_components/project-task-list";

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export const metadata: Metadata = {
  title: "Project Details",
  robots: { index: false, follow: false },
};

/** Project details - progress, budget, room/dates, and the task checklist that drives progress. */
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const home = await requireHomeForCurrentUser();

  const project = await getProjectById(home.id, projectId);

  if (!project) {
    notFound();
  }

  const [tasks, room] = await Promise.all([
    getTasksForProject(project.id),
    project.roomId ? getRoomById(home.id, project.roomId) : Promise.resolve(null),
  ]);

  const progress = calculateProjectProgress(tasks);
  const deleteAction = deleteProjectAction.bind(null, project.id);

  const hasBudget = project.budgetPlannedCents !== null || project.budgetUsedCents !== null;
  const remainingCents =
    project.budgetPlannedCents !== null && project.budgetUsedCents !== null
      ? project.budgetPlannedCents - project.budgetUsedCents
      : null;

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
            <Icon icon={Hammer} size="md" />
          </div>
          <div>
            <Eyebrow tone="brand">Home Planner</Eyebrow>
            <Heading as="h1" size="h2" className="mt-2">
              {project.name}
            </Heading>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={getProjectStatusVariant(project.status)}>{getProjectStatusLabel(project.status)}</Badge>
              <Badge variant="neutral">{getProjectCategoryLabel(project.category)}</Badge>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            href={`/app/home-planner/projects/${project.id}/edit`}
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

      <div className="grid gap-6 sm:grid-cols-2">
        <Card variant="standard" padding="lg" className="flex items-center gap-5">
          <div className="relative shrink-0">
            <ProgressRing percent={progress.percent} size={72} strokeWidth={7} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-h4 leading-none text-ink">{progress.percent}%</span>
            </div>
          </div>
          <div>
            <Text size="body-sm" tone="muted">
              Progress
            </Text>
            <Text size="body" weight="medium" className="mt-0.5 text-ink">
              {progress.totalCount > 0 ? `${progress.completedCount} of ${progress.totalCount} tasks done` : "No tasks yet"}
            </Text>
          </div>
        </Card>

        <Card variant="standard" padding="lg" className="flex flex-col justify-center gap-2">
          <Text size="body-sm" tone="muted">
            Budget
          </Text>
          {hasBudget ? (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Text size="body" className="text-ink">
                Planned: <span className="font-medium">{formatMoney(project.budgetPlannedCents)}</span>
              </Text>
              <Text size="body" className="text-ink">
                Spent: <span className="font-medium">{formatMoney(project.budgetUsedCents)}</span>
              </Text>
              {remainingCents !== null && (
                <Text size="body" tone={remainingCents < 0 ? "error" : "default"}>
                  Remaining: <span className="font-medium">{formatMoney(remainingCents)}</span>
                </Text>
              )}
            </div>
          ) : (
            <Text size="body-sm" tone="faint">
              No budget set yet
            </Text>
          )}
        </Card>
      </div>

      <Card variant="standard" padding="lg" className="flex flex-col gap-5">
        <div>
          <Text size="body-sm" tone="muted">
            Room
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {room?.name ?? "Not assigned"}
          </Text>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Text size="body-sm" tone="muted">
              Start date
            </Text>
            <Text size="body" className="mt-0.5 text-ink">
              {project.startDate ?? "Not set"}
            </Text>
          </div>
          <div>
            <Text size="body-sm" tone="muted">
              Target completion
            </Text>
            <Text size="body" className="mt-0.5 text-ink">
              {project.targetCompletionDate ?? "Not set"}
            </Text>
          </div>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Description
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {project.description || "Nothing added yet"}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Notes
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {project.notes || "Nothing added yet"}
          </Text>
        </div>
      </Card>

      <ProjectTaskList projectId={project.id} tasks={tasks} />

      <Button href="/app/home-planner/projects" variant="ghost" className="self-start">
        Back to projects
      </Button>
    </Container>
  );
}

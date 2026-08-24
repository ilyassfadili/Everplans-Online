import { Hammer } from "lucide-react";

import { Badge, Card, Icon, Link, ProgressRing, Text } from "@/components/ui";
import { getProjectCategoryLabel } from "@/components/home-planner/project-category-options";
import { getProjectStatusLabel, getProjectStatusVariant } from "@/components/home-planner/project-status-options";
import type { Project, ProjectProgress } from "@/types/home-planner";

interface ProjectCardProps {
  project: Project;
  progress: ProjectProgress;
}

/** One project, as a scannable card - name links to its detail page, progress ring reflects real task completion. */
export function ProjectCard({ project, progress }: ProjectCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
          <Icon icon={Hammer} size="sm" />
        </div>
        {progress.totalCount > 0 && (
          <div className="relative shrink-0">
            <ProgressRing percent={progress.percent} size={40} strokeWidth={4} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-caption font-medium text-ink">{progress.percent}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <Link href={`/app/home-planner/projects/${project.id}`} variant="prominent" className="block truncate">
          {project.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge variant={getProjectStatusVariant(project.status)}>{getProjectStatusLabel(project.status)}</Badge>
          <Badge variant="neutral">{getProjectCategoryLabel(project.category)}</Badge>
        </div>
      </div>

      {project.description && (
        <Text size="body-sm" tone="muted" className="line-clamp-2">
          {project.description}
        </Text>
      )}

      <Text size="body-sm" tone="faint">
        {progress.totalCount > 0 ? `${progress.completedCount} of ${progress.totalCount} tasks done` : "No tasks yet"}
      </Text>
    </Card>
  );
}

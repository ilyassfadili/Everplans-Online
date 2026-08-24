import { Hammer } from "lucide-react";

import { Badge, Button, Card, ProgressRing, Text } from "@/components/ui";
import { getProjectStatusLabel } from "@/components/home-planner/project-status-options";
import { calculateProjectProgress } from "@/lib/home-planner/project-progress";
import type { Project, ProjectTask } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface ProjectsSummaryCardProps {
  projects: Project[];
  tasksByProjectId: Record<string, ProjectTask[]>;
}

/**
 * A small, lightweight Projects summary for the Home Dashboard (Prompt 4
 * Phase 3: "add a project summary to the Home Dashboard... keep it
 * concise and useful"), the same shape `MaintenanceSummaryCard`/
 * `BillsSummaryCard` establish.
 */
export function ProjectsSummaryCard({ projects, tasksByProjectId }: ProjectsSummaryCardProps) {
  const active = projects.filter((project) => project.status !== "completed");

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Hammer}
        title="Projects"
        action={
          <Button href="/app/home-planner/projects" variant="ghost" size="sm">
            View
          </Button>
        }
      />
      <div className="mt-4 flex-1">
        {active.length === 0 ? (
          <Text size="body-sm" tone="faint">
            No active projects right now.
          </Text>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {active.slice(0, 4).map((project) => {
              const progress = calculateProjectProgress(tasksByProjectId[project.id] ?? []);
              return (
                <li key={project.id} className="flex items-center justify-between gap-2">
                  <Text size="body-sm" className="min-w-0 truncate text-ink">
                    {project.name}
                  </Text>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="neutral">{getProjectStatusLabel(project.status)}</Badge>
                    {progress.totalCount > 0 && (
                      <div className="relative size-6 shrink-0">
                        <ProgressRing percent={progress.percent} size={24} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {active.length > 4 && (
          <Text size="body-sm" tone="faint" className="mt-2.5">
            +{active.length - 4} more
          </Text>
        )}
      </div>
    </Card>
  );
}

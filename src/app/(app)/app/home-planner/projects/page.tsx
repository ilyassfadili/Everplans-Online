import { Hammer, Plus } from "lucide-react";
import type { Metadata } from "next";

import { Button, Container, EmptyState, Eyebrow, Heading, Icon, Text } from "@/components/ui";
import { calculateProjectProgress } from "@/lib/home-planner/project-progress";
import { getTasksForProject } from "@/lib/home-planner/project-tasks";
import { getProjectsForHome } from "@/lib/home-planner/projects";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";

import { ProjectCard } from "./_components/project-card";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

/**
 * Home Projects (Everplans Home Planner Prompt 4 Phase 3) - "What am I
 * working on, what needs to happen next, and where does the project
 * stand?" Gated the same way every Home Planner route is: no workspace
 * yet redirects to setup.
 */
export default async function ProjectsPage() {
  const home = await requireHomeForCurrentUser();

  const projects = await getProjectsForHome(home.id);
  const projectsWithProgress = await Promise.all(
    projects.map(async (project) => ({
      project,
      progress: calculateProjectProgress(await getTasksForProject(project.id)),
    })),
  );

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Eyebrow tone="brand">Home Planner</Eyebrow>
          <Heading as="h1" size="h2" className="mt-2">
            Projects
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
            Home improvements and repairs for {home.name}.
          </Text>
        </div>
        <Button href="/app/home-planner/projects/new" leadingIcon={<Icon icon={Plus} size="sm" />} className="shrink-0">
          New project
        </Button>
      </div>

      {projectsWithProgress.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="Start your first project"
          description="Track home improvements and repairs from planning through completion."
          action={<Button href="/app/home-planner/projects/new">New project</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projectsWithProgress.map(({ project, progress }) => (
            <ProjectCard key={project.id} project={project} progress={progress} />
          ))}
        </div>
      )}
    </Container>
  );
}

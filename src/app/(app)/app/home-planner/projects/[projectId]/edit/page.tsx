import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getProjectById } from "@/lib/home-planner/projects";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { EditProjectForm } from "./_components/edit-project-form";

interface EditProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export const metadata: Metadata = {
  title: "Edit Project",
  robots: { index: false, follow: false },
};

/** Edit project details - the same `ProjectFormFields` used to create the project, pre-filled with its current values. */
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { projectId } = await params;
  const home = await requireHomeForCurrentUser();

  const [project, rooms] = await Promise.all([getProjectById(home.id, projectId), getRoomsForHome(home.id)]);

  if (!project) {
    notFound();
  }

  const roomOptions = rooms.map((room) => ({ value: room.id, label: room.name }));

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Edit project
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Update anything about this project - your changes save right here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <EditProjectForm project={project} roomOptions={roomOptions} />
      </Card>
    </Container>
  );
}

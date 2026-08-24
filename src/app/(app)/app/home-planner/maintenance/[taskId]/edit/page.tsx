import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getMaintenanceTaskById } from "@/lib/home-planner/maintenance";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { EditTaskForm } from "./_components/edit-task-form";

interface EditTaskPageProps {
  params: Promise<{ taskId: string }>;
}

export const metadata: Metadata = {
  title: "Edit Task",
  robots: { index: false, follow: false },
};

/** Edit task details - the same `MaintenanceTaskFormFields` used to create the task, pre-filled with its current values. */
export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { taskId } = await params;
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const [task, rooms] = await Promise.all([getMaintenanceTaskById(home.id, taskId), getRoomsForHome(home.id)]);

  if (!task) {
    notFound();
  }

  const roomOptions: SelectOption[] = rooms.map((room) => ({ value: room.id, label: room.name }));

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Edit task
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Update anything about this task - your changes save right here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <EditTaskForm task={task} roomOptions={roomOptions} />
      </Card>
    </Container>
  );
}

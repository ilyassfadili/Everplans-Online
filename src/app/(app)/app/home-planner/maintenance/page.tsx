import type { Metadata } from "next";

import { Container, Eyebrow, Heading, Text } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getMaintenanceTasksForHome } from "@/lib/home-planner/maintenance";
import { calculateMaintenanceStatus } from "@/lib/home-planner/maintenance-status";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { AddTaskForm } from "./_components/add-task-form";
import { MaintenanceStats } from "./_components/maintenance-stats";
import { TaskList, type TaskWithStatus } from "./_components/task-list";

export const metadata: Metadata = {
  title: "Maintenance",
  robots: { index: false, follow: false },
};

/**
 * Home Maintenance (Everplans Home Planner Prompt 3 Phase 1) - "What needs
 * attention around my home?" Gated the same way every Home Planner route
 * is: no workspace yet redirects to setup.
 */
export default async function MaintenancePage() {
  const home = await requireHomeForCurrentUser();

  const [tasks, rooms] = await Promise.all([getMaintenanceTasksForHome(home.id), getRoomsForHome(home.id)]);
  const roomOptions: SelectOption[] = rooms.map((room) => ({ value: room.id, label: room.name }));
  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]));

  // Status is derived at read time, not stored (`calculateMaintenanceStatus`'s
  // own comment) - computed once here, server-side, against the real "now"
  // at render time, then passed down as plain data.
  const today = new Date();
  const items: TaskWithStatus[] = tasks.map((task) => ({
    task,
    status: calculateMaintenanceStatus(task, today),
    roomName: task.roomId ? (roomNameById.get(task.roomId) ?? null) : null,
  }));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Maintenance
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          What needs attention around {home.name}.
        </Text>
      </div>

      <MaintenanceStats items={items} />
      <AddTaskForm homeId={home.id} roomOptions={roomOptions} />
      <TaskList items={items} />
    </Container>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { CreateProjectForm } from "./_components/create-project-form";

export const metadata: Metadata = {
  title: "New Project",
  robots: { index: false, follow: false },
};

/** Create a project. Gated the same way every Home Planner route is: no workspace yet redirects to setup. */
export default async function NewProjectPage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const rooms = await getRoomsForHome(home.id);
  const roomOptions = rooms.map((room) => ({ value: room.id, label: room.name }));

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          New project
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Give it a name, category, and status - you can add tasks and detail once it&rsquo;s
          created.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <CreateProjectForm homeId={home.id} roomOptions={roomOptions} />
      </Card>
    </Container>
  );
}

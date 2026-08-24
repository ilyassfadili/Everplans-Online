import type { Metadata } from "next";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";

import { CreateRoomForm } from "./_components/create-room-form";

export const metadata: Metadata = {
  title: "Add Room",
  robots: { index: false, follow: false },
};

/**
 * Add a room (Phase 1). Gated the same way every Home Planner route is: no
 * workspace yet redirects to setup.
 */
export default async function NewRoomPage() {
  const home = await requireHomeForCurrentUser();

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Add a room
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Give it a name and type - you can add more detail any time.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <CreateRoomForm homeId={home.id} />
      </Card>
    </Container>
  );
}

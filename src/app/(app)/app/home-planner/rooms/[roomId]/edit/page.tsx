import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getRoomById } from "@/lib/home-planner/rooms";

import { EditRoomForm } from "./_components/edit-room-form";

interface EditRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export const metadata: Metadata = {
  title: "Edit Room",
  robots: { index: false, follow: false },
};

/** Edit room details - the same `RoomFormFields` used to create the room, pre-filled with its current values. */
export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const { roomId } = await params;
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const room = await getRoomById(home.id, roomId);

  if (!room) {
    notFound();
  }

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Edit room
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Update anything about this room - your changes save right here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <EditRoomForm room={room} />
      </Card>
    </Container>
  );
}

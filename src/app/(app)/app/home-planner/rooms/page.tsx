import { DoorOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Container, EmptyState, Eyebrow, Heading, Icon, Text } from "@/components/ui";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { RoomCard } from "./_components/room-card";

export const metadata: Metadata = {
  title: "Rooms",
  robots: { index: false, follow: false },
};

/**
 * The Rooms overview (Everplans Home Planner Prompt 2 Phase 1). Gated the
 * same way every Home Planner route is: no workspace yet redirects to
 * setup.
 */
export default async function RoomsPage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const rooms = await getRoomsForHome(home.id);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Eyebrow tone="brand">Home Planner</Eyebrow>
          <Heading as="h1" size="h2" className="mt-2">
            Rooms
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
            Every room in {home.name}, organized in one place.
          </Text>
        </div>
        <Button href="/app/home-planner/rooms/new" leadingIcon={<Icon icon={Plus} size="sm" />} className="shrink-0">
          Add room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="Add your first room"
          description="Start organizing your home by adding the rooms in it - you can add descriptions and notes to each one."
          action={<Button href="/app/home-planner/rooms/new">Add room</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </Container>
  );
}

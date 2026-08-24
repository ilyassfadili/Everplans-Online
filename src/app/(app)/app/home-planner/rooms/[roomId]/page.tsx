import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, Button, Card, Container, Eyebrow, Heading, Icon, Text } from "@/components/ui";
import { getRoomTypeLabel, ROOM_TYPE_ICONS } from "@/components/home-planner/room-type-options";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getRoomById } from "@/lib/home-planner/rooms";

import { DeleteRoomButton } from "./_components/delete-room-button";

interface RoomDetailPageProps {
  params: Promise<{ roomId: string }>;
}

export const metadata: Metadata = {
  title: "Room Details",
  robots: { index: false, follow: false },
};

/**
 * Room details (Phase 1: "provide room information, room metadata, and
 * relevant room actions"). The foundation later Home Planner prompts build
 * on - no inventory/maintenance/projects here yet, those don't exist yet.
 */
export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { roomId } = await params;
  const home = await requireHomeForCurrentUser();

  const room = await getRoomById(home.id, roomId);

  if (!room) {
    notFound();
  }

  const RoomIcon = ROOM_TYPE_ICONS[room.roomType];

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
            <Icon icon={RoomIcon} size="md" />
          </div>
          <div>
            <Eyebrow tone="brand">Home Planner</Eyebrow>
            <Heading as="h1" size="h2" className="mt-2">
              {room.name}
            </Heading>
            <Badge variant="neutral" className="mt-2">
              {getRoomTypeLabel(room.roomType)}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            href={`/app/home-planner/rooms/${room.id}/edit`}
            variant="outline"
            leadingIcon={<Icon icon={Pencil} size="sm" />}
          >
            Edit
          </Button>
          <DeleteRoomButton roomId={room.id} roomName={room.name} />
        </div>
      </div>

      <Card variant="standard" padding="lg" className="flex flex-col gap-5">
        <div>
          <Text size="body-sm" tone="muted">
            Description
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {room.description || "Nothing added yet"}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Notes
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {room.notes || "Nothing added yet"}
          </Text>
        </div>
      </Card>

      <Button href="/app/home-planner/rooms" variant="ghost" className="self-start">
        Back to rooms
      </Button>
    </Container>
  );
}

"use client";

import { Trash2 } from "lucide-react";

import { Card, Icon, Link, Text } from "@/components/ui";
import { getRoomTypeLabel, ROOM_TYPE_ICONS } from "@/components/home-planner/room-type-options";
import type { Room } from "@/types/home-planner";

import { deleteRoomAction } from "../actions";

interface RoomCardProps {
  room: Room;
}

/**
 * One room, as a scannable card (Phase 1: "use appropriate cards, icons,
 * labels"). The name is the click target into the room's detail page; the
 * delete control is a sibling of that link (not nested inside it), so the
 * card never ends up with a `<button>` inside an `<a>`.
 */
export function RoomCard({ room }: RoomCardProps) {
  const RoomIcon = ROOM_TYPE_ICONS[room.roomType];

  function handleDelete() {
    if (window.confirm(`Remove ${room.name}? This can't be undone.`)) {
      void deleteRoomAction(room.id);
    }
  }

  return (
    <Card variant="standard" padding="lg" className="relative flex h-full flex-col gap-3">
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Remove ${room.name}`}
        className="absolute right-4 top-4 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Icon icon={Trash2} size="sm" />
      </button>

      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
        <Icon icon={RoomIcon} size="sm" />
      </div>

      <div className="min-w-0 pr-8">
        <Link href={`/app/home-planner/rooms/${room.id}`} variant="prominent" className="block truncate">
          {room.name}
        </Link>
        <Text size="body-sm" tone="muted" className="mt-0.5">
          {getRoomTypeLabel(room.roomType)}
        </Text>
      </div>

      {room.description && (
        <Text size="body-sm" tone="muted" className="line-clamp-2">
          {room.description}
        </Text>
      )}
    </Card>
  );
}

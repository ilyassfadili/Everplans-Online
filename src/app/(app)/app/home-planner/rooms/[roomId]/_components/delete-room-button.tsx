"use client";

import { Trash2 } from "lucide-react";

import { Button, Icon } from "@/components/ui";

import { deleteRoomAction } from "../../actions";

interface DeleteRoomButtonProps {
  roomId: string;
  roomName: string;
}

/** The room detail page's delete action - confirm, then remove and return to the rooms overview (`deleteRoomAction` redirects there). */
export function DeleteRoomButton({ roomId, roomName }: DeleteRoomButtonProps) {
  function handleDelete() {
    if (window.confirm(`Remove ${roomName}? This can't be undone.`)) {
      void deleteRoomAction(roomId);
    }
  }

  return (
    <Button variant="outline" onClick={handleDelete} leadingIcon={<Icon icon={Trash2} size="sm" />}>
      Delete room
    </Button>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createRoom, deleteRoom, updateRoom } from "@/lib/home-planner/rooms";
import type { RoomType } from "@/types/home-planner";

/**
 * The rooms feature's own Server Actions - thin wrappers around
 * `@/lib/home-planner/rooms`, colocated here since every route under
 * `/app/home-planner/rooms` shares them, the same shape
 * `wedding-planner/guests/actions.ts` establishes for a single feature
 * area.
 */

const ROOMS_PATH = "/app/home-planner/rooms";
const HOME_PLANNER_PATH = "/app/home-planner";

function revalidateRooms() {
  revalidatePath(ROOMS_PATH);
  revalidatePath(HOME_PLANNER_PATH);
}

function readRoomInput(formData: FormData) {
  const name = formData.get("name");
  const roomType = formData.get("roomType");
  const description = formData.get("description");
  const notes = formData.get("notes");

  return {
    name: typeof name === "string" ? name : "",
    // Cast, not validated here - `createRoom`/`updateRoom`'s zod schema
    // (`z.enum`) is the real validation; an unrecognized value fails there
    // with a friendly "Choose a room type" message rather than silently
    // defaulting.
    roomType: (typeof roomType === "string" ? roomType : "") as RoomType,
    description: typeof description === "string" ? description : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  };
}

export interface CreateRoomFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

/** Creates a room, then redirects into its own detail page - there's nothing left to show on the "new room" screen once the room exists. */
export async function createRoomFormAction(
  homeId: string,
  _prevState: CreateRoomFormState,
  formData: FormData,
): Promise<CreateRoomFormState> {
  const result = await createRoom(homeId, readRoomInput(formData));

  if (result.status === "success") {
    revalidateRooms();
    redirect(`/app/home-planner/rooms/${result.room.id}`);
  }
  return { status: result.status, message: result.message };
}

export interface UpdateRoomFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
}

/** Edits a room in place - the same "stay on the page, report success" pattern `updateHomeFormAction` uses, since there's nowhere more useful to send someone who just edited their own room. */
export async function updateRoomFormAction(
  roomId: string,
  _prevState: UpdateRoomFormState,
  formData: FormData,
): Promise<UpdateRoomFormState> {
  const result = await updateRoom(roomId, readRoomInput(formData));

  if (result.status === "success") {
    revalidateRooms();
    return { status: "success", message: "Saved." };
  }
  return { status: result.status, message: result.message };
}

export async function deleteRoomAction(roomId: string): Promise<void> {
  await deleteRoom(roomId);
  revalidateRooms();
  redirect(ROOMS_PATH);
}

import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Room, RoomType } from "@/types/home-planner";

/**
 * Home Planner rooms - `public.home_rooms`
 * (`supabase/migrations/20260910000002_home_rooms.sql`). Same shape as
 * `@/lib/home-planner/household-members`/`@/lib/wedding/guests`: every
 * function calls `requireUser()` itself, and RLS (a join back to
 * `homes.owner_id`) independently enforces the same "only this home's
 * owner" boundary.
 */

const ROOM_COLUMNS = "id, home_id, name, room_type, description, notes, created_at, updated_at";

const ROOM_TYPES = [
  "living-room",
  "bedroom",
  "kitchen",
  "bathroom",
  "office",
  "dining-room",
  "garage",
  "basement",
  "garden",
  "other",
] as const satisfies readonly RoomType[];

type RoomRow = {
  id: string;
  home_id: string;
  name: string;
  room_type: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapRoomRow(row: RoomRow): Room {
  return {
    id: row.id,
    homeId: row.home_id,
    name: row.name,
    // Cast, not re-validated: `home_rooms_room_type_valid` (the migration)
    // already guarantees the database can never hold anything outside
    // this union.
    roomType: row.room_type as RoomType,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRoomsForHome(homeId: string): Promise<Room[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_rooms")
    .select(ROOM_COLUMNS)
    .eq("home_id", homeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getRoomsForHome: failed to load rooms", error);
    return [];
  }

  return (data ?? []).map(mapRoomRow);
}

/**
 * A single room by id - the room detail/edit screens' own lookup.
 * Deliberately scoped by `homeId` too (not just `id`), so a room from a
 * different home can never render under the wrong workspace even before
 * RLS is consulted - RLS is still the real, independent enforcement.
 */
export async function getRoomById(homeId: string, roomId: string): Promise<Room | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_rooms")
    .select(ROOM_COLUMNS)
    .eq("id", roomId)
    .eq("home_id", homeId)
    .maybeSingle();

  if (error) {
    console.error("getRoomById: failed to load room", error);
    return null;
  }

  return data ? mapRoomRow(data) : null;
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const roomSchema = z.object({
  name: z.string().trim().min(1, "Enter a room name.").max(150, "Keep it under 150 characters."),
  roomType: z.enum(ROOM_TYPES, { message: "Choose a room type." }),
  description: optionalTextSchema(500, "Keep it under 500 characters."),
  notes: optionalTextSchema(2000, "Keep it under 2000 characters."),
});

export type RoomInput = z.input<typeof roomSchema>;

export type RoomMutationResult =
  | { status: "success"; room: Room }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Room creation (Phase 1: "avoid unnecessary form complexity") - name, type, and optional description/notes. */
export async function createRoom(homeId: string, input: RoomInput): Promise<RoomMutationResult> {
  await requireUser();

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_rooms")
    .insert({
      home_id: homeId,
      name: parsed.data.name,
      room_type: parsed.data.roomType,
      description: parsed.data.description,
      notes: parsed.data.notes,
    })
    .select(ROOM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createRoom: failed to create room", error);
    return { status: "error", message: "Couldn't add that room. Please try again." };
  }

  return { status: "success", room: mapRoomRow(data) };
}

/** Edits a room - ships every field editable from day one, the same shape `updateHome` follows. */
export async function updateRoom(roomId: string, input: RoomInput): Promise<RoomMutationResult> {
  await requireUser();

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_rooms")
    .update({
      name: parsed.data.name,
      room_type: parsed.data.roomType,
      description: parsed.data.description,
      notes: parsed.data.notes,
    })
    .eq("id", roomId)
    .select(ROOM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateRoom: failed to update room", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", room: mapRoomRow(data) };
}

export type DeleteRoomResult = { status: "success" } | { status: "error"; message: string };

export async function deleteRoom(roomId: string): Promise<DeleteRoomResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("home_rooms").delete().eq("id", roomId);

  if (error) {
    console.error("deleteRoom: failed to delete room", error);
    return { status: "error", message: "Couldn't remove that room. Please try again." };
  }

  return { status: "success" };
}

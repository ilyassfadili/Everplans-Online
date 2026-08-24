import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeddingEvent } from "@/types/wedding";

/**
 * Wedding Planner events - `public.wedding_events`
 * (`supabase/migrations/20260829000000_wedding_venues_and_events.sql`).
 * One unified table for every kind of event; `event_id` on
 * `wedding_event_vendors`/`wedding_event_guests` (the many-to-many join
 * tables) is what connects an event to the canonical vendor/guest
 * records - never a copy of vendor/guest data on the event itself.
 */

const EVENT_COLUMNS = "id, wedding_id, venue_id, name, description, event_type, event_date, start_time, end_time, created_at, updated_at";

type EventRow = {
  id: string;
  wedding_id: string;
  venue_id: string | null;
  name: string;
  description: string | null;
  event_type: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
};

function mapEventRow(row: EventRow): WeddingEvent {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    venueId: row.venue_id,
    name: row.name,
    description: row.description,
    eventType: row.event_type,
    eventDate: row.event_date,
    // Postgres returns `time` as `HH:MM:SS` - trimmed to `HH:MM` to match
    // exactly what an `<input type="time">` both renders and submits (the
    // same convention `important-dates.ts` already established).
    startTime: row.start_time ? row.start_time.slice(0, 5) : null,
    endTime: row.end_time ? row.end_time.slice(0, 5) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getEventsForWedding(weddingId: string): Promise<WeddingEvent[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_events")
    .select(EVENT_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("getEventsForWedding: failed to load events", error);
    return [];
  }

  return (data ?? []).map(mapEventRow);
}

export async function getEventById(eventId: string): Promise<WeddingEvent | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_events").select(EVENT_COLUMNS).eq("id", eventId).maybeSingle();

  if (error) {
    console.error("getEventById: failed to load event", error);
    return null;
  }

  return data ? mapEventRow(data) : null;
}

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const eventFieldsSchema = {
  name: z.string().trim().min(1, "Give this event a name.").max(150, "Keep it under 150 characters."),
  eventType: optionalIdSchema,
  eventDate: z.string().trim().min(1, "Choose a date."),
  startTime: optionalIdSchema,
  endTime: optionalIdSchema,
  venueId: optionalIdSchema,
};

const createEventSchema = z.object({
  name: eventFieldsSchema.name,
  eventType: eventFieldsSchema.eventType,
  eventDate: eventFieldsSchema.eventDate,
  startTime: eventFieldsSchema.startTime,
  endTime: eventFieldsSchema.endTime,
  venueId: eventFieldsSchema.venueId,
});

export type CreateEventInput = z.input<typeof createEventSchema>;

export type EventMutationResult =
  | { status: "success"; event: WeddingEvent }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Quick event creation (Phase 2: "do not create long complicated event forms") - name, date, and optional type/venue/time. */
export async function createEvent(weddingId: string, input: CreateEventInput): Promise<EventMutationResult> {
  await requireUser();

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_events")
    .insert({
      wedding_id: weddingId,
      venue_id: parsed.data.venueId,
      name: parsed.data.name,
      event_type: parsed.data.eventType,
      event_date: parsed.data.eventDate,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
    })
    .select(EVENT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createEvent: failed to create event", error);
    return { status: "error", message: "Couldn't add that event. Please try again." };
  }

  return { status: "success", event: mapEventRow(data) };
}

const updateEventSchema = z.object({
  name: eventFieldsSchema.name.optional(),
  description: optionalIdSchema,
  eventType: eventFieldsSchema.eventType,
  eventDate: eventFieldsSchema.eventDate.optional(),
  startTime: eventFieldsSchema.startTime,
  endTime: eventFieldsSchema.endTime,
  venueId: eventFieldsSchema.venueId,
});

export type UpdateEventInput = z.input<typeof updateEventSchema>;

/** Edits an event - only the fields actually present in `input` are written, checked against the raw `input` (see `updateTask`'s own comment for why). */
export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<EventMutationResult> {
  await requireUser();

  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: {
    name?: string;
    description?: string | null;
    event_type?: string | null;
    event_date?: string;
    start_time?: string | null;
    end_time?: string | null;
    venue_id?: string | null;
  } = {};

  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.eventDate !== undefined) patch.event_date = parsed.data.eventDate;
  if (Object.hasOwn(input, "description")) patch.description = parsed.data.description;
  if (Object.hasOwn(input, "eventType")) patch.event_type = parsed.data.eventType;
  if (Object.hasOwn(input, "startTime")) patch.start_time = parsed.data.startTime;
  if (Object.hasOwn(input, "endTime")) patch.end_time = parsed.data.endTime;
  if (Object.hasOwn(input, "venueId")) patch.venue_id = parsed.data.venueId;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_events").update(patch).eq("id", eventId).select(EVENT_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateEvent: failed to update event", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", event: mapEventRow(data) };
}

export type DeleteEventResult = { status: "success" } | { status: "error"; message: string };

/** Deletes an event. Tasks that referenced it become unassigned (`on delete set null`); vendor/guest links are removed along with it (`on delete cascade` on the join tables, which own no data beyond the relationship itself). */
export async function deleteEvent(eventId: string): Promise<DeleteEventResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_events").delete().eq("id", eventId);

  if (error) {
    console.error("deleteEvent: failed to delete event", error);
    return { status: "error", message: "Couldn't remove that event. Please try again." };
  }

  return { status: "success" };
}

// --- Event <-> vendor/guest relationships ---------------------------------

export async function getVendorIdsForEvent(eventId: string): Promise<string[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_event_vendors").select("vendor_id").eq("event_id", eventId);

  if (error) {
    console.error("getVendorIdsForEvent: failed to load event vendors", error);
    return [];
  }

  return (data ?? []).map((row) => row.vendor_id);
}

export async function getGuestIdsForEvent(eventId: string): Promise<string[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_event_guests").select("guest_id").eq("event_id", eventId);

  if (error) {
    console.error("getGuestIdsForEvent: failed to load event guests", error);
    return [];
  }

  return (data ?? []).map((row) => row.guest_id);
}

export type LinkMutationResult = { status: "success" } | { status: "error"; message: string };

export async function addVendorToEvent(eventId: string, vendorId: string): Promise<LinkMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_event_vendors").upsert({ event_id: eventId, vendor_id: vendorId });

  if (error) {
    console.error("addVendorToEvent: failed to link vendor", error);
    return { status: "error", message: "Couldn't add that vendor to the event." };
  }
  return { status: "success" };
}

export async function removeVendorFromEvent(eventId: string, vendorId: string): Promise<LinkMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_event_vendors").delete().eq("event_id", eventId).eq("vendor_id", vendorId);

  if (error) {
    console.error("removeVendorFromEvent: failed to unlink vendor", error);
    return { status: "error", message: "Couldn't remove that vendor from the event." };
  }
  return { status: "success" };
}

export async function addGuestToEvent(eventId: string, guestId: string): Promise<LinkMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_event_guests").upsert({ event_id: eventId, guest_id: guestId });

  if (error) {
    console.error("addGuestToEvent: failed to link guest", error);
    return { status: "error", message: "Couldn't add that guest to the event." };
  }
  return { status: "success" };
}

export async function removeGuestFromEvent(eventId: string, guestId: string): Promise<LinkMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_event_guests").delete().eq("event_id", eventId).eq("guest_id", guestId);

  if (error) {
    console.error("removeGuestFromEvent: failed to unlink guest", error);
    return { status: "error", message: "Couldn't remove that guest from the event." };
  }
  return { status: "success" };
}

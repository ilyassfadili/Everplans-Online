"use server";

import { revalidatePath } from "next/cache";

import {
  addGuestToEvent,
  addVendorToEvent,
  createEvent,
  deleteEvent,
  removeGuestFromEvent,
  removeVendorFromEvent,
  updateEvent,
  type CreateEventInput,
  type EventMutationResult,
  type LinkMutationResult,
  type UpdateEventInput,
} from "@/lib/wedding/events";
import { createTask, updateTask, type TaskMutationResult } from "@/lib/wedding/tasks";
import { createVenue, deleteVenue, updateVenue, type CreateVenueInput, type UpdateVenueInput, type VenueMutationResult } from "@/lib/wedding/venues";

/**
 * Events and venues' own Server Actions - thin wrappers around
 * `@/lib/wedding/{events,venues}`. Colocated at the `events/` segment
 * root (not inside `[eventId]/`) since both the list page (venues +
 * events) and each event's detail page use these same mutations.
 */

const EVENTS_PATH = "/app/wedding-planner/events";
const TIMELINE_PATH = "/app/wedding-planner/timeline";
const WEDDING_PLANNER_PATH = "/app/wedding-planner";
const CHECKLIST_PATH = "/app/wedding-planner/checklist";

function revalidateEvents() {
  revalidatePath(EVENTS_PATH);
  revalidatePath(TIMELINE_PATH);
  revalidatePath(WEDDING_PLANNER_PATH);
  revalidatePath(CHECKLIST_PATH);
}

export interface CreateVenueFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createVenueFormAction(weddingId: string, _prevState: CreateVenueFormState, formData: FormData): Promise<CreateVenueFormState> {
  const name = formData.get("name");
  const address = formData.get("address");

  const input: CreateVenueInput = {
    name: typeof name === "string" ? name : "",
    address: typeof address === "string" ? address : undefined,
  };

  const result = await createVenue(weddingId, input);
  if (result.status === "success") {
    revalidateEvents();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editVenueAction(venueId: string, input: UpdateVenueInput): Promise<VenueMutationResult> {
  const result = await updateVenue(venueId, input);
  if (result.status === "success") revalidateEvents();
  return result;
}

export async function removeVenueAction(venueId: string): Promise<void> {
  await deleteVenue(venueId);
  revalidateEvents();
}

export interface CreateEventFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createEventFormAction(weddingId: string, _prevState: CreateEventFormState, formData: FormData): Promise<CreateEventFormState> {
  const name = formData.get("name");
  const eventType = formData.get("eventType");
  const eventDate = formData.get("eventDate");
  const venueId = formData.get("venueId");

  const input: CreateEventInput = {
    name: typeof name === "string" ? name : "",
    eventType: typeof eventType === "string" ? eventType : undefined,
    eventDate: typeof eventDate === "string" ? eventDate : "",
    venueId: typeof venueId === "string" ? venueId : undefined,
  };

  const result = await createEvent(weddingId, input);
  if (result.status === "success") {
    revalidateEvents();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editEventAction(eventId: string, input: UpdateEventInput): Promise<EventMutationResult> {
  const result = await updateEvent(eventId, input);
  if (result.status === "success") revalidateEvents();
  return result;
}

export async function removeEventAction(eventId: string): Promise<void> {
  await deleteEvent(eventId);
  revalidateEvents();
}

export async function linkVendorToEventAction(eventId: string, vendorId: string): Promise<LinkMutationResult> {
  const result = await addVendorToEvent(eventId, vendorId);
  if (result.status === "success") revalidateEvents();
  return result;
}

export async function unlinkVendorFromEventAction(eventId: string, vendorId: string): Promise<void> {
  await removeVendorFromEvent(eventId, vendorId);
  revalidateEvents();
}

export async function linkGuestToEventAction(eventId: string, guestId: string): Promise<LinkMutationResult> {
  const result = await addGuestToEvent(eventId, guestId);
  if (result.status === "success") revalidateEvents();
  return result;
}

export async function unlinkGuestFromEventAction(eventId: string, guestId: string): Promise<void> {
  await removeGuestFromEvent(eventId, guestId);
  revalidateEvents();
}

/** Quick-creates a task already scoped to this event - the event detail page's own lightweight task creation (extends the existing task architecture, never a second one). */
export async function createEventTaskAction(weddingId: string, eventId: string, title: string): Promise<TaskMutationResult> {
  const result = await createTask(weddingId, { title, eventId });
  if (result.status === "success") revalidateEvents();
  return result;
}

/** Links an already-existing task to this event. */
export async function assignTaskToEventAction(taskId: string, eventId: string): Promise<TaskMutationResult> {
  const result = await updateTask(taskId, { eventId });
  if (result.status === "success") revalidateEvents();
  return result;
}

/** Unlinks a task from this event - the task itself isn't deleted, just unassigned. */
export async function unassignTaskFromEventAction(taskId: string): Promise<void> {
  await updateTask(taskId, { eventId: "" });
  revalidateEvents();
}

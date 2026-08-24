import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking, BookingStatus, BookingType } from "@/types/travel";

import { parseAmountToCents } from "./currency";

/**
 * Travel Planner bookings (Prompt 3 Phase 3) - `public.trip_bookings`, a
 * centralized ORGANIZATION record for reservations made elsewhere, not a
 * booking marketplace (the migration's own scope note). Same shape as
 * `@/lib/travel/activities`: every function calls `requireUser()` itself,
 * and RLS (a join back to `trips.owner_id`) independently enforces "only
 * this trip's owner."
 */

const BOOKING_COLUMNS =
  "id, trip_id, booking_type, title, provider, confirmation_number, booking_date, booking_time, location, cost_cents, status, notes, created_at, updated_at";

const BOOKING_TYPES = [
  "flight",
  "train",
  "bus",
  "hotel",
  "car-rental",
  "activity",
  "restaurant",
  "other",
] as const satisfies readonly BookingType[];

const BOOKING_STATUSES = ["planned", "confirmed", "cancelled"] as const satisfies readonly BookingStatus[];

type BookingRow = {
  id: string;
  trip_id: string;
  booking_type: string;
  title: string;
  provider: string | null;
  confirmation_number: string | null;
  booking_date: string;
  booking_time: string | null;
  location: string | null;
  cost_cents: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapBookingRow(row: BookingRow): Booking {
  return {
    id: row.id,
    tripId: row.trip_id,
    bookingType: row.booking_type as BookingType,
    title: row.title,
    provider: row.provider,
    confirmationNumber: row.confirmation_number,
    bookingDate: row.booking_date,
    // Postgres returns `time` as `HH:MM:SS` - trimmed to `HH:MM`, the same
    // convention `getActivitiesForTripDayIds` already applies.
    bookingTime: row.booking_time ? row.booking_time.slice(0, 5) : null,
    location: row.location,
    costCents: row.cost_cents,
    status: row.status as BookingStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every booking for a trip, soonest first - the bookings page's own grouping/filtering happens over this full list. */
export async function getBookingsForTrip(tripId: string): Promise<Booking[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_bookings")
    .select(BOOKING_COLUMNS)
    .eq("trip_id", tripId)
    .order("booking_date", { ascending: true });

  if (error) {
    console.error("getBookingsForTrip: failed to load bookings", error);
    return [];
  }

  return (data ?? []).map(mapBookingRow);
}

const bookingSchema = z.object({
  bookingType: z.enum(BOOKING_TYPES, { message: "Choose a booking type." }),
  title: z.string().trim().min(1, "Give this booking a title.").max(150, "Keep it under 150 characters."),
  provider: z
    .string()
    .trim()
    .max(150, "Keep it under 150 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  confirmationNumber: z
    .string()
    .trim()
    .max(100, "Keep it under 100 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  bookingDate: z.string().trim().min(1, "Choose a date."),
  bookingTime: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  location: z
    .string()
    .trim()
    .max(200, "Keep it under 200 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  costCents: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? parseAmountToCents(value) : null))
    .pipe(z.number({ error: "Enter a valid amount." }).int().min(0, "Amount can't be negative.").nullable()),
  status: z.enum(BOOKING_STATUSES, { message: "Choose a status." }),
  notes: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type BookingInput = z.input<typeof bookingSchema>;

export type BookingMutationResult =
  | { status: "success"; booking: Booking }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createBooking(tripId: string, input: BookingInput): Promise<BookingMutationResult> {
  await requireUser();

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_bookings")
    .insert({
      trip_id: tripId,
      booking_type: parsed.data.bookingType,
      title: parsed.data.title,
      provider: parsed.data.provider,
      confirmation_number: parsed.data.confirmationNumber,
      booking_date: parsed.data.bookingDate,
      booking_time: parsed.data.bookingTime,
      location: parsed.data.location,
      cost_cents: parsed.data.costCents,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .select(BOOKING_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createBooking: failed to create booking", error);
    return { status: "error", message: "Couldn't add that booking. Please try again." };
  }

  return { status: "success", booking: mapBookingRow(data) };
}

/** Edits a booking in place - full replace (every field, the same shape the edit form always submits, matching `updateActivity`'s own approach). */
export async function updateBooking(bookingId: string, input: BookingInput): Promise<BookingMutationResult> {
  await requireUser();

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trip_bookings")
    .update({
      booking_type: parsed.data.bookingType,
      title: parsed.data.title,
      provider: parsed.data.provider,
      confirmation_number: parsed.data.confirmationNumber,
      booking_date: parsed.data.bookingDate,
      booking_time: parsed.data.bookingTime,
      location: parsed.data.location,
      cost_cents: parsed.data.costCents,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .eq("id", bookingId)
    .select(BOOKING_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateBooking: failed to update booking", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", booking: mapBookingRow(data) };
}

export type DeleteBookingResult = { status: "success" } | { status: "error"; message: string };

export async function deleteBooking(bookingId: string): Promise<DeleteBookingResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("trip_bookings").delete().eq("id", bookingId);

  if (error) {
    console.error("deleteBooking: failed to delete booking", error);
    return { status: "error", message: "Couldn't remove that booking. Please try again." };
  }

  return { status: "success" };
}

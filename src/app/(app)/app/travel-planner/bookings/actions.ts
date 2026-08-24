"use server";

import { revalidatePath } from "next/cache";

import {
  createBooking,
  deleteBooking,
  updateBooking,
  type BookingInput,
  type BookingMutationResult,
  type DeleteBookingResult,
} from "@/lib/travel/bookings";

/**
 * The Bookings page's own Server Actions - thin wrappers around
 * `@/lib/travel/bookings`, the same split every other mutation in this
 * codebase uses. Every successful mutation revalidates this page and the
 * dashboard, the same `revalidateBudget`-style pattern `budget/actions.ts`
 * already establishes.
 */

const BOOKINGS_PATH = "/app/travel-planner/bookings";
const DASHBOARD_PATH = "/app/travel-planner";

function revalidateBookings() {
  revalidatePath(BOOKINGS_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function createBookingAction(tripId: string, input: BookingInput): Promise<BookingMutationResult> {
  const result = await createBooking(tripId, input);
  if (result.status === "success") {
    revalidateBookings();
  }
  return result;
}

export async function updateBookingAction(bookingId: string, input: BookingInput): Promise<BookingMutationResult> {
  const result = await updateBooking(bookingId, input);
  if (result.status === "success") {
    revalidateBookings();
  }
  return result;
}

export async function deleteBookingAction(bookingId: string): Promise<DeleteBookingResult> {
  const result = await deleteBooking(bookingId);
  if (result.status === "success") {
    revalidateBookings();
  }
  return result;
}

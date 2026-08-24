"use client";

import { Ticket } from "lucide-react";

import { EmptyState, Stack } from "@/components/ui";
import type { Booking } from "@/types/travel";

import { deleteBookingAction, updateBookingAction } from "../actions";
import { BookingRow } from "./booking-row";

interface BookingsListProps {
  bookings: Booking[];
  currency: string;
}

/** The centralized booking overview (Phase 3 §8) - every booking, soonest first (already sorted by the query), each carrying its own type/status/date at a glance. */
export function BookingsList({ bookings, currency }: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="No bookings yet"
        description="Add a flight, hotel, or any other reservation to keep it organized in one place."
        className="py-14"
      />
    );
  }

  return (
    <Stack gap="3">
      {bookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking} currency={currency} onSave={updateBookingAction} onDelete={deleteBookingAction} />
      ))}
    </Stack>
  );
}

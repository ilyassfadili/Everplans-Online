"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button, Card, DatePicker, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { BOOKING_STATUS_OPTIONS, BOOKING_TYPE_OPTIONS } from "@/components/travel/booking-options";
import type { BookingInput } from "@/lib/travel/bookings";

import { createBookingAction } from "../actions";

interface AddBookingFormProps {
  tripId: string;
}

/**
 * "+ Add booking" - collapsed by default (the same "don't open every form
 * at once" restraint `AddActivityForm` already establishes), given how
 * many fields a booking can carry. Takes `tripId` (plain data) rather than
 * a bound save function and calls `createBookingAction` directly - a
 * Server Component can't hand a Client Component an arbitrary closure
 * over a Server Action, the same fix `BudgetOverview`'s own comment
 * explains.
 */
export function AddBookingForm({ tripId }: AddBookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await createBookingAction(tripId, {
      bookingType: (formData.get("bookingType")?.toString() || "other") as BookingInput["bookingType"],
      title: formData.get("title")?.toString() ?? "",
      provider: formData.get("provider")?.toString() || undefined,
      confirmationNumber: formData.get("confirmationNumber")?.toString() || undefined,
      bookingDate: formData.get("bookingDate")?.toString() ?? "",
      bookingTime: formData.get("bookingTime")?.toString() || undefined,
      location: formData.get("location")?.toString() || undefined,
      costCents: formData.get("costCents")?.toString() || undefined,
      status: (formData.get("status")?.toString() || "planned") as BookingInput["status"],
      notes: formData.get("notes")?.toString() || undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsOpen(false);
    } else {
      setError(result.message ?? "Couldn't add that booking.");
    }
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="secondary" leadingIcon={<Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />} onClick={() => setIsOpen(true)}>
        Add booking
      </Button>
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <form action={handleSubmit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="title" maxLength={150} aria-label="Booking title" placeholder="e.g. Flight to Lisbon" required autoFocus />
          <Select name="bookingType" options={BOOKING_TYPE_OPTIONS} defaultValue="flight" aria-label="Booking type" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="provider" maxLength={150} aria-label="Provider (optional)" placeholder="Provider / company (optional)" />
          <Input name="confirmationNumber" maxLength={100} aria-label="Confirmation number (optional)" placeholder="Confirmation # (optional)" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <DatePicker name="bookingDate" aria-label="Date" required />
          <Input name="bookingTime" type="time" aria-label="Time (optional)" />
          <Select name="status" options={BOOKING_STATUS_OPTIONS} defaultValue="planned" aria-label="Status" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="location" maxLength={200} aria-label="Location (optional)" placeholder="Location (optional)" />
          <Input name="costCents" inputMode="decimal" aria-label="Cost (optional)" placeholder="Cost (optional)" />
        </div>
        <Textarea name="notes" maxLength={1000} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
        {error && (
          <Text size="body-sm" tone="error">
            {error}
          </Text>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={isSaving}>
            Add booking
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

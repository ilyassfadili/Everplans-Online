"use client";

import { useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Card, DatePicker, Icon, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import {
  BOOKING_STATUS_BADGE_VARIANT,
  BOOKING_STATUS_OPTIONS,
  BOOKING_TYPE_OPTIONS,
  getBookingStatusLabel,
  getBookingTypeLabel,
} from "@/components/travel/booking-options";
import { formatCurrency } from "@/lib/travel/currency";
import { formatActivityTime, formatBookingDate } from "@/lib/travel/format";
import type { BookingInput, BookingMutationResult, DeleteBookingResult } from "@/lib/travel/bookings";
import type { Booking } from "@/types/travel";

interface BookingRowProps {
  booking: Booking;
  currency: string;
  onSave: (bookingId: string, input: BookingInput) => Promise<BookingMutationResult>;
  onDelete: (bookingId: string) => Promise<DeleteBookingResult>;
}

/** One booking - a centralized organization record for a reservation made elsewhere, editable/deletable inline, the same pattern every other row in this planner uses. */
export function BookingRow({ booking, currency, onSave, onDelete }: BookingRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await onSave(booking.id, {
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
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that booking.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${booking.title}" from your bookings?`)) return;
    setIsDeleting(true);
    const result = await onDelete(booking.id);
    if (result.status !== "success") {
      setIsDeleting(false);
      setError(result.message ?? "Couldn't remove that booking.");
    }
  }

  if (isEditing) {
    return (
      <Card variant="standard" padding="lg">
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="title" defaultValue={booking.title} maxLength={150} aria-label="Booking title" required />
            <Select name="bookingType" options={BOOKING_TYPE_OPTIONS} defaultValue={booking.bookingType} aria-label="Booking type" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="provider" defaultValue={booking.provider ?? ""} maxLength={150} aria-label="Provider (optional)" placeholder="Provider / company (optional)" />
            <Input name="confirmationNumber" defaultValue={booking.confirmationNumber ?? ""} maxLength={100} aria-label="Confirmation number (optional)" placeholder="Confirmation # (optional)" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <DatePicker name="bookingDate" defaultValue={booking.bookingDate} aria-label="Date" required />
            <Input name="bookingTime" type="time" defaultValue={booking.bookingTime ?? ""} aria-label="Time (optional)" />
            <Select name="status" options={BOOKING_STATUS_OPTIONS} defaultValue={booking.status} aria-label="Status" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="location" defaultValue={booking.location ?? ""} maxLength={200} aria-label="Location (optional)" placeholder="Location (optional)" />
            <Input name="costCents" defaultValue={booking.costCents !== null ? (booking.costCents / 100).toFixed(2) : ""} inputMode="decimal" aria-label="Cost (optional)" placeholder="Cost (optional)" />
          </div>
          <Textarea name="notes" defaultValue={booking.notes ?? ""} maxLength={1000} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{getBookingTypeLabel(booking.bookingType)}</Badge>
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[booking.status] ?? "neutral"}>{getBookingStatusLabel(booking.status)}</Badge>
          </div>
          <Text size="body" weight="medium" className="mt-2 text-ink">
            {booking.title}
          </Text>
          <Text size="body-sm" tone="muted" className="mt-0.5">
            {formatBookingDate(booking.bookingDate)}
            {booking.bookingTime ? ` · ${formatActivityTime(booking.bookingTime)}` : ""}
            {booking.provider ? ` · ${booking.provider}` : ""}
          </Text>
          {booking.location && (
            <div className="mt-1 flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
              <Text size="body-sm" tone="muted">
                {booking.location}
              </Text>
            </div>
          )}
          {booking.confirmationNumber && (
            <Text size="body-sm" tone="faint" className="mt-1">
              Confirmation: {booking.confirmationNumber}
            </Text>
          )}
          {booking.notes && (
            <Text size="body-sm" tone="muted" className="mt-1 whitespace-pre-wrap">
              {booking.notes}
            </Text>
          )}
          {error && (
            <Text size="body-sm" tone="error" className="mt-1">
              {error}
            </Text>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {booking.costCents !== null && (
            <Text size="body-sm" weight="semibold" className="tabular-nums text-ink">
              {formatCurrency(booking.costCents, currency)}
            </Text>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label={`Edit "${booking.title}"`}
              className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <Icon icon={Pencil} size="sm" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label={`Remove "${booking.title}"`}
              className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <Icon icon={Trash2} size="sm" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

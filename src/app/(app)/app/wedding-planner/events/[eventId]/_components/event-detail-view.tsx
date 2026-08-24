"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Card, DatePicker, Heading, Label, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { EVENT_TYPE_OPTIONS } from "@/components/wedding/event-type-options";
import type { WeddingEvent, WeddingGuest, WeddingTask, WeddingVendor, WeddingVenue } from "@/types/wedding";

import { editEventAction, linkGuestToEventAction, linkVendorToEventAction, removeEventAction, unlinkGuestFromEventAction, unlinkVendorFromEventAction } from "../../actions";
import { EventLinkedItemsSection } from "./event-linked-items-section";
import { EventTasksSection } from "./event-tasks-section";

function formatEventDateTime(eventDate: string, startTime: string | null, endTime: string | null): string {
  const date = new Date(`${eventDate}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  if (!startTime) return dateLabel;

  const format = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(0, 0, 0, hours, minutes).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  return endTime ? `${dateLabel} · ${format(startTime)} – ${format(endTime)}` : `${dateLabel} · ${format(startTime)}`;
}

interface EventDetailViewProps {
  weddingId: string;
  event: WeddingEvent;
  venues: WeddingVenue[];
  vendors: WeddingVendor[];
  guests: WeddingGuest[];
  tasks: WeddingTask[];
  assignedVendorIds: string[];
  assignedGuestIds: string[];
}

/** The event detail page (Prompt 5 Phase 2) - editable identity/timing/venue, plus its real vendor, guest, and task relationships. */
export function EventDetailView({ weddingId, event, venues, vendors, guests, tasks, assignedVendorIds, assignedGuestIds }: EventDetailViewProps) {
  const router = useRouter();
  const venue = event.venueId ? (venues.find((item) => item.id === event.venueId) ?? null) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const venueOptions = venues.map((item) => ({ value: item.id, label: item.name }));

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const eventType = formData.get("eventType");
    const eventDate = formData.get("eventDate");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const venueId = formData.get("venueId");
    const description = formData.get("description");

    setIsSaving(true);
    const result = await editEventAction(event.id, {
      name: typeof name === "string" ? name : undefined,
      eventType: typeof eventType === "string" ? eventType : "",
      eventDate: typeof eventDate === "string" ? eventDate : undefined,
      startTime: typeof startTime === "string" ? startTime : "",
      endTime: typeof endTime === "string" ? endTime : "",
      venueId: typeof venueId === "string" ? venueId : "",
      description: typeof description === "string" ? description : "",
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleDelete() {
    if (window.confirm(`Remove "${event.name}"? Related tasks will stay, just unlinked from this event.`)) {
      void removeEventAction(event.id);
      router.push("/app/wedding-planner/events");
    }
  }

  const eventTasks = tasks.filter((task) => task.eventId === event.id);
  const unassignedTasks = tasks.filter((task) => !task.eventId);

  const linkedVendors = vendors.filter((vendor) => assignedVendorIds.includes(vendor.id));
  const availableVendors = vendors.filter((vendor) => !assignedVendorIds.includes(vendor.id));
  const linkedGuests = guests.filter((guest) => assignedGuestIds.includes(guest.id));
  const availableGuests = guests.filter((guest) => !assignedGuestIds.includes(guest.id));

  return (
    <div className="flex flex-col gap-6">
      <Card variant="standard" padding="lg">
        {isEditing ? (
          <form action={handleSave} className="flex flex-col gap-4">
            {error && (
              <Alert variant="error" title="Couldn’t save your changes">
                {error}
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="event-name">Name</Label>
                <Input id="event-name" name="name" defaultValue={event.name} maxLength={150} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-type">Type</Label>
                <Select id="event-type" name="eventType" defaultValue={event.eventType ?? undefined} placeholder="Choose a type" options={EVENT_TYPE_OPTIONS} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-venue">Venue</Label>
                <Select id="event-venue" name="venueId" defaultValue={event.venueId ?? undefined} placeholder="No venue" options={venueOptions} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-date">Date</Label>
                <DatePicker id="event-date" name="eventDate" defaultValue={event.eventDate} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-start-time">Start</Label>
                  <Input id="event-start-time" name="startTime" type="time" defaultValue={event.startTime ?? ""} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-end-time">End</Label>
                  <Input id="event-end-time" name="endTime" type="time" defaultValue={event.endTime ?? ""} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-description">
                Description <span className="font-normal text-ink-faint">(optional)</span>
              </Label>
              <Textarea id="event-description" name="description" defaultValue={event.description ?? ""} rows={3} maxLength={2000} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Heading as="h1" size="h3">
                  {event.name}
                </Heading>
                <Text size="body" tone="muted" className="mt-1">
                  {formatEventDateTime(event.eventDate, event.startTime, event.endTime)}
                  {venue && ` · ${venue.name}`}
                </Text>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {event.eventType && <Badge variant="outline">{event.eventType}</Badge>}
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>
            {event.description && (
              <Text size="body-sm" tone="muted" className="mt-4 border-t border-line-subtle pt-4">
                {event.description}
              </Text>
            )}
          </>
        )}
      </Card>

      <EventTasksSection weddingId={weddingId} eventId={event.id} eventTasks={eventTasks} unassignedTasks={unassignedTasks} />

      <div className="grid gap-6 sm:grid-cols-2">
        <EventLinkedItemsSection
          title="Vendors"
          emptyText="No vendors linked yet."
          linkedItems={linkedVendors.map((vendor) => ({ id: vendor.id, label: vendor.name, sublabel: vendor.category ?? undefined }))}
          availableItems={availableVendors.map((vendor) => ({ id: vendor.id, label: vendor.name }))}
          addPlaceholder="Add a vendor"
          onAdd={(vendorId) => linkVendorToEventAction(event.id, vendorId)}
          onRemove={(vendorId) => void unlinkVendorFromEventAction(event.id, vendorId)}
        />
        <EventLinkedItemsSection
          title="Guests"
          emptyText="No guests linked yet."
          linkedItems={linkedGuests.map((guest) => ({ id: guest.id, label: `${guest.firstName} ${guest.lastName}` }))}
          availableItems={availableGuests.map((guest) => ({ id: guest.id, label: `${guest.firstName} ${guest.lastName}` }))}
          addPlaceholder="Add a guest"
          onAdd={(guestId) => linkGuestToEventAction(event.id, guestId)}
          onRemove={(guestId) => void unlinkGuestFromEventAction(event.id, guestId)}
        />
      </div>

      <Button variant="ghost" size="sm" className="self-start text-error hover:text-error" onClick={handleDelete}>
        Remove event
      </Button>
    </div>
  );
}

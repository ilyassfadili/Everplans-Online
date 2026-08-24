"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { EVENT_TYPE_OPTIONS } from "@/components/wedding/event-type-options";
import type { WeddingVenue } from "@/types/wedding";

import { createEventFormAction, type CreateEventFormState } from "../actions";

const initialState: CreateEventFormState = { status: "idle" };

interface AddEventFormProps {
  weddingId: string;
  venues: WeddingVenue[];
}

/** Quick event creation (Phase 2: "do not create long complicated event forms") - name, date, and optional type/venue. */
export function AddEventForm({ weddingId, venues }: AddEventFormProps) {
  const action = createEventFormAction.bind(null, weddingId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  const venueOptions = venues.map((venue) => ({ value: venue.id, label: venue.name }));

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that event" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="new-event-name">Add an event</Label>
          <Input id="new-event-name" name="name" placeholder="e.g. Reception" maxLength={150} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-event-type">
            Type <span className="font-normal text-ink-faint">(optional)</span>
          </Label>
          <Select id="new-event-type" name="eventType" placeholder="Choose a type" options={EVENT_TYPE_OPTIONS} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-event-date">Date</Label>
          <DatePicker id="new-event-date" name="eventDate" required />
        </div>
        {venueOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-event-venue">
              Venue <span className="font-normal text-ink-faint">(optional)</span>
            </Label>
            <Select id="new-event-venue" name="venueId" placeholder="No venue" options={venueOptions} />
          </div>
        )}
        <Button type="submit" loading={isCreating} className="self-end sm:col-span-2 sm:w-auto sm:justify-self-start lg:col-span-1">
          Add event
        </Button>
      </form>
    </Card>
  );
}

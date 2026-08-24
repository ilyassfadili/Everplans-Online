"use client";

import { useActionState, useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";

import { Alert, Button, Card, EmptyState, Heading, Icon, Label, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { WeddingVenue } from "@/types/wedding";

import { createVenueFormAction, editVenueAction, removeVenueAction, type CreateVenueFormState } from "../actions";

const initialState: CreateVenueFormState = { status: "idle" };

function VenueRow({ venue }: { venue: WeddingVenue }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const address = formData.get("address");

    setIsSaving(true);
    const result = await editVenueAction(venue.id, {
      name: typeof name === "string" ? name : undefined,
      address: typeof address === "string" ? address : "",
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
    if (window.confirm(`Remove "${venue.name}"? Events that used it will keep working, just without a venue link.`)) {
      void removeVenueAction(venue.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <Input name="name" defaultValue={venue.name} maxLength={150} aria-label="Venue name" required />
          <Input name="address" defaultValue={venue.address ?? ""} maxLength={300} aria-label="Address" placeholder="Address" />
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
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <Text size="body" weight="medium" className="text-ink">
          {venue.name}
        </Text>
        {venue.address && (
          <Text size="body-sm" tone="muted">
            {venue.address}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${venue.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove "${venue.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

interface VenueListProps {
  weddingId: string;
  venues: WeddingVenue[];
}

/** Venues (Prompt 5 Phase 1) - managed here, inline, rather than a separate top-level route: a venue only ever exists to be assigned to an event, so it lives alongside events, not as its own product area. */
export function VenueList({ weddingId, venues }: VenueListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createVenueFormAction.bind(null, weddingId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Venues
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add venue
          </Button>
        )}
      </div>

      {venues.length === 0 && !isAdding && (
        <EmptyState
          icon={MapPin}
          title="No venues yet"
          description="Add a venue to assign it to your events."
          className="mt-4 py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add your first venue
            </Button>
          }
        />
      )}

      {venues.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {venues.map((venue) => (
            <VenueRow key={venue.id} venue={venue} />
          ))}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn’t add that venue">
              {formState.message}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-venue-name">Venue name</Label>
              <Input id="new-venue-name" name="name" placeholder="e.g. Riverside Barn" maxLength={150} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-venue-address">
                Address <span className="font-normal text-ink-faint">(optional)</span>
              </Label>
              <Input id="new-venue-address" name="address" maxLength={300} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add venue
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

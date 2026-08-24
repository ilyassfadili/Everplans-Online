"use client";

import { useActionState } from "react";

import { Alert, Button, Stack } from "@/components/ui";
import { TripFormFields } from "@/components/travel/trip-form-fields";
import type { Trip } from "@/types/travel";

import { updateTripFormAction } from "../actions";
import { updateTripFormInitialState } from "./form-state";

interface EditTripFormProps {
  trip: Trip;
}

/**
 * The edit counterpart to `OnboardingForm` (`../../onboarding/_components/onboarding-form.tsx`)
 * - same `TripFormFields` markup, pre-filled with the trip's current
 * values, submitting to `updateTripFormAction` instead of `createTripFormAction`.
 * A hidden `tripId` input carries which row to update; RLS is still the
 * real enforcement that this can only ever be the current user's own trip.
 */
export function EditTripForm({ trip }: EditTripFormProps) {
  const [state, formAction, isPending] = useActionState(updateTripFormAction, updateTripFormInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "success" && (
          <Alert variant="success" title="Saved">
            Your trip details have been updated.
          </Alert>
        )}
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t save your changes">
            {state.message}
          </Alert>
        )}

        <input type="hidden" name="tripId" value={trip.id} />

        <TripFormFields
          defaultValues={{
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            travelerCount: trip.travelerCount,
            tripType: trip.tripType,
            tripGoals: trip.tripGoals,
            notes: trip.notes,
          }}
        />

        <Button type="submit" loading={isPending} className="self-start">
          Save changes
        </Button>
      </Stack>
    </form>
  );
}

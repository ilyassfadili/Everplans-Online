"use client";

import { useActionState } from "react";

import { Alert, Button, Stack, Text } from "@/components/ui";
import { TripFormFields } from "@/components/travel/trip-form-fields";

import { createTripFormAction } from "../actions";
import { createTripFormInitialState } from "./form-state";

/**
 * The Travel Planner trip setup form - the minimum information needed to
 * create a workspace (Prompt 1 Phase 3): destination, dates, travelers,
 * trip type, goals, and notes. `TripFormFields` carries the actual field
 * markup, shared with the edit form.
 *
 * `useActionState` + `loading={isPending}` is what prevents a duplicate
 * submission from a fast double-click: the button disables itself the
 * instant the action starts, the same pattern `OnboardingForm`
 * (Wedding Planner) already uses. A genuine race (two tabs, a resubmit
 * after the response already landed) is still caught server-side by
 * `trips_owner_unique` (`createTrip`'s own comment) - this is the fast,
 * friendly layer in front of that real guarantee, not a substitute for it.
 */
export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(createTripFormAction, createTripFormInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t create your trip">
            {state.message}
          </Alert>
        )}

        <TripFormFields />

        <div>
          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            Create my trip
          </Button>
          <Text size="body-sm" tone="faint" className="mt-3">
            This just gets your planning started - nothing here is set in stone.
          </Text>
        </div>
      </Stack>
    </form>
  );
}

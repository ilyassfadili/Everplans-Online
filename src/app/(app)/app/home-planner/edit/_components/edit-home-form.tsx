"use client";

import { useActionState } from "react";

import { Alert, Button, Stack } from "@/components/ui";
import { HomeFormFields } from "@/components/home-planner/home-form-fields";
import type { Home } from "@/types/home-planner";

import { updateHomeFormAction } from "../actions";
import { updateHomeFormInitialState } from "./form-state";

interface EditHomeFormProps {
  home: Home;
}

/**
 * The edit counterpart to `OnboardingForm` (`../../onboarding/_components/onboarding-form.tsx`)
 * - same `HomeFormFields` markup, pre-filled with the home's current
 * values, submitting to `updateHomeFormAction` instead of `createHomeFormAction`.
 * A hidden `homeId` input carries which row to update; RLS is still the
 * real enforcement that this can only ever be the current user's own home.
 */
export function EditHomeForm({ home }: EditHomeFormProps) {
  const [state, formAction, isPending] = useActionState(updateHomeFormAction, updateHomeFormInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "success" && (
          <Alert variant="success" title="Saved">
            Your home details have been updated.
          </Alert>
        )}
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t save your changes">
            {state.message}
          </Alert>
        )}

        <input type="hidden" name="homeId" value={home.id} />

        <HomeFormFields
          defaultValues={{
            name: home.name,
            homeType: home.homeType,
            ownershipStatus: home.ownershipStatus,
            addressLine1: home.addressLine1,
            addressLine2: home.addressLine2,
            city: home.city,
            state: home.state,
            postalCode: home.postalCode,
            country: home.country,
            notes: home.notes,
          }}
        />

        <Button type="submit" loading={isPending} className="self-start">
          Save changes
        </Button>
      </Stack>
    </form>
  );
}

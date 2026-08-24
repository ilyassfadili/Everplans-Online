"use client";

import { useActionState } from "react";

import { Alert, Button, Stack, Text } from "@/components/ui";
import { HomeFormFields } from "@/components/home-planner/home-form-fields";

import { createHomeFormAction } from "../actions";
import { createHomeFormInitialState } from "./form-state";

/**
 * The Home Planner setup form - the minimum information needed to create a
 * workspace (Phase 2's "Basic Home Information"). `HomeFormFields` carries
 * the actual field markup, shared with the edit form.
 *
 * `useActionState` + `loading={isPending}` is what prevents a duplicate
 * submission from a fast double-click: the button disables itself the
 * instant the action starts, the same pattern `OnboardingForm` (Travel
 * Planner) already uses. A genuine race (two tabs, a resubmit after the
 * response already landed) is still caught server-side by
 * `homes_owner_unique` (`createHome`'s own comment) - this is the fast,
 * friendly layer in front of that real guarantee, not a substitute for it.
 */
export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(createHomeFormAction, createHomeFormInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t set up your home">
            {state.message}
          </Alert>
        )}

        <HomeFormFields />

        <div>
          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            Set up my home
          </Button>
          <Text size="body-sm" tone="faint" className="mt-3">
            This just gets your planning started - nothing here is set in stone.
          </Text>
        </div>
      </Stack>
    </form>
  );
}

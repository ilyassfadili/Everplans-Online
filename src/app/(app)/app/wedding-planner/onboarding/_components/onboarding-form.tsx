"use client";

import { useActionState } from "react";

import { Alert, Button, DatePicker, FormField, Stack, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";

import { createWeddingFormAction } from "../actions";
import { createWeddingFormInitialState } from "./form-state";

/**
 * The Wedding Planner onboarding form - the minimum information needed to
 * create a workspace (Prompt 1 Phase 3): both partners' names and an
 * optional wedding date. Nothing else - no budget, guest count, venue, or
 * any other later-phase field.
 *
 * `useActionState` + `loading={isPending}` is what prevents a duplicate
 * submission from a fast double-click: the button disables itself the
 * instant the action starts, the same pattern `ProfileSettingsForm` already
 * uses. A genuine race (two tabs, a resubmit after the response already
 * landed) is still caught server-side by `weddings_owner_unique`
 * (`createWedding`'s own comment) - this is the fast, friendly layer in
 * front of that real guarantee, not a substitute for it.
 */
export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(createWeddingFormAction, createWeddingFormInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {(state.status === "error" || state.status === "invalid") && (
          <Alert variant="error" title="Couldn’t create your workspace">
            {state.message}
          </Alert>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Partner 1's name" required>
            <Input name="partnerOneName" autoComplete="off" placeholder="Jordan" maxLength={100} />
          </FormField>
          <FormField label="Partner 2's name" required>
            <Input name="partnerTwoName" autoComplete="off" placeholder="Alex" maxLength={100} />
          </FormField>
        </div>

        <FormField label="Wedding date" hint="Haven't decided yet? Leave this blank - you can add it later.">
          <DatePicker name="weddingDate" />
        </FormField>

        <div>
          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            Create our wedding workspace
          </Button>
          <Text size="body-sm" tone="faint" className="mt-3">
            This just gets your planning started - nothing here is set in stone.
          </Text>
        </div>
      </Stack>
    </form>
  );
}

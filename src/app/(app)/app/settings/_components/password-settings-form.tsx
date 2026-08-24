"use client";

import { useActionState } from "react";

import { Alert, Button, FormField, Stack } from "@/components/ui";
import { PasswordInput } from "@/components/ui/form/password-input";

import { updatePasswordFormAction } from "../actions";
import { updatePasswordFormInitialState } from "./form-state";

/**
 * The Account & Security section of `/app/settings` - real password
 * changes via `updatePasswordFormAction` (`../actions.ts`), which calls
 * Supabase's own `auth.updateUser({ password })` (the same underlying
 * call `/reset-password`'s form already uses). No second authentication
 * mechanism, no duplicated session logic - this is the existing Supabase
 * Auth system, reused from a second entry point.
 */
export function PasswordSettingsForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordFormAction, updatePasswordFormInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "success" && (
          <Alert variant="success" title="Password updated">
            {state.message}
          </Alert>
        )}
        {state.status === "error" && !state.fieldErrors && (
          <Alert variant="error" title="Couldn’t update your password">
            {state.message}
          </Alert>
        )}

        <FormField label="New password" required error={state.fieldErrors?.password} hint="At least 8 characters.">
          <PasswordInput name="password" autoComplete="new-password" placeholder="••••••••" />
        </FormField>

        <Button type="submit" loading={isPending} className="self-start">
          Update password
        </Button>
      </Stack>
    </form>
  );
}

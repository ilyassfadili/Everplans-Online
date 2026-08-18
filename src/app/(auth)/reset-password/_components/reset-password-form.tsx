"use client";

import { useActionState } from "react";

import { Alert, Button, FormField, Stack } from "@/components/ui";
import { PasswordInput } from "@/components/ui/form/password-input";

import { resetPasswordInitialState, updatePassword } from "../actions";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, resetPasswordInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "error" && !state.fieldErrors && (
          <Alert variant="error" title="Couldn't update your password">
            {state.message}
          </Alert>
        )}

        <FormField
          label="New password"
          required
          error={state.fieldErrors?.password}
          hint="At least 8 characters."
        >
          <PasswordInput name="password" autoComplete="new-password" placeholder="••••••••" />
        </FormField>

        <Button type="submit" loading={isPending} className="w-full">
          Update password
        </Button>
      </Stack>
    </form>
  );
}

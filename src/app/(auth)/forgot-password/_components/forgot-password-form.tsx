"use client";

import { useActionState } from "react";

import { Alert, Button, FormField, Stack } from "@/components/ui";
import { Input } from "@/components/ui/form/input";

import { forgotPasswordInitialState, requestPasswordReset } from "../actions";

/**
 * The form itself stays visible after a successful send, rather than being
 * replaced the way Sign Up's confirmation screen is - resubmitting the same
 * email here is harmless, so "try again" is just clicking the button once
 * more, not a separate resend flow.
 */
export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, forgotPasswordInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "sent" && (
          <Alert variant="success" title="Check your inbox">
            {state.message}
          </Alert>
        )}
        {state.status === "error" && !state.fieldErrors && (
          <Alert variant="error" title="Couldn't send the reset link">
            {state.message}
          </Alert>
        )}

        <FormField label="Email" required error={state.fieldErrors?.email}>
          <Input name="email" type="email" autoComplete="email" placeholder="jane@example.com" />
        </FormField>

        <Button type="submit" loading={isPending} className="w-full">
          Send reset link
        </Button>
      </Stack>
    </form>
  );
}

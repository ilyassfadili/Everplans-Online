"use client";

import { useActionState } from "react";

import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button";
import { Alert, Button, FormField, Link, Stack } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { PasswordInput } from "@/components/ui/form/password-input";

import { signIn, signInInitialState } from "../actions";

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signIn, signInInitialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="5">
        {state.status === "error" && !state.fieldErrors && (
          <Alert variant="error" title="Couldn't sign you in">
            {state.message}
          </Alert>
        )}

        {state.emailNotConfirmed && state.email && (
          <ResendConfirmationButton email={state.email} />
        )}

        <FormField label="Email" required error={state.fieldErrors?.email}>
          <Input name="email" type="email" autoComplete="email" placeholder="jane@example.com" />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <FormField label="Password" required error={state.fieldErrors?.password}>
            <PasswordInput name="password" autoComplete="current-password" placeholder="••••••••" />
          </FormField>
          <Link href="/forgot-password" variant="subtle" className="self-end text-body-sm">
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          Sign In
        </Button>
      </Stack>
    </form>
  );
}

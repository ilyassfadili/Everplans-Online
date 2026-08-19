"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { OrDivider } from "@/components/auth/or-divider";
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button";
import { Alert, Button, FormField, Heading, Stack, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { PasswordInput } from "@/components/ui/form/password-input";

import { signUp, signUpInitialState } from "../actions";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, signUpInitialState);

  if (state.status === "confirmation-required") {
    return (
      <div className="animate-hero-in flex flex-col items-center gap-3 rounded-lg border border-line-subtle bg-surface p-8 text-center">
        <MailCheck className="size-8 animate-icon-pop text-brand" strokeWidth={1.5} aria-hidden="true" />
        <Heading as="h2" size="h4">
          Confirm your email
        </Heading>
        <Text tone="muted" className="max-w-xs">
          {state.message}
        </Text>
        {state.email && (
          <div className="mt-2">
            <ResendConfirmationButton email={state.email} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <OAuthButtons />

      <OrDivider />

      <form action={formAction} noValidate>
        <Stack gap="5">
          {state.status === "error" && !state.fieldErrors && (
            <Alert variant="error" title="Couldn't create your account">
              {state.message}
            </Alert>
          )}

          <FormField label="Full name" required error={state.fieldErrors?.fullName}>
            <Input name="fullName" type="text" autoComplete="name" placeholder="Jane Doe" />
          </FormField>

          <FormField label="Email" required error={state.fieldErrors?.email}>
            <Input name="email" type="email" autoComplete="email" placeholder="jane@example.com" />
          </FormField>

          <FormField
            label="Password"
            required
            error={state.fieldErrors?.password}
            hint="At least 8 characters."
          >
            <PasswordInput name="password" autoComplete="new-password" placeholder="••••••••" />
          </FormField>

          <Button type="submit" loading={isPending} className="w-full">
            Create account
          </Button>
        </Stack>
      </form>
    </>
  );
}

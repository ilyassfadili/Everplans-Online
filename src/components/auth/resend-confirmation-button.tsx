"use client";

import { useActionState } from "react";

import { resendConfirmationEmail, resendInitialState } from "@/app/(auth)/actions";
import { Button, Text } from "@/components/ui";

interface ResendConfirmationButtonProps {
  email: string;
}

/**
 * A one-click "send it again" - the difference between a dead end and a
 * recoverable moment when an email is slow, lands in spam, or its link
 * expires. `email` comes from the page (already typed once, on Sign In or
 * Sign Up), so this never asks for it a second time.
 */
export function ResendConfirmationButton({ email }: ResendConfirmationButtonProps) {
  const [state, formAction, isPending] = useActionState(resendConfirmationEmail, resendInitialState);
  const sent = state.status === "sent";

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="outline" size="sm" loading={isPending} disabled={sent}>
        {sent ? "Email sent" : "Resend confirmation email"}
      </Button>
      {state.status === "error" && (
        <Text size="body-sm" tone="error" role="alert">
          {state.message}
        </Text>
      )}
      {sent && (
        <Text size="body-sm" tone="success" role="status">
          {state.message}
        </Text>
      )}
    </form>
  );
}

"use client";

import { useActionState } from "react";

import { Alert, Button, Text } from "@/components/ui";

import { retryOrderVerificationAction, type RetryOrderVerificationState } from "../actions";

const INITIAL_STATE: RetryOrderVerificationState = { status: "idle", message: "" };

interface RetryVerificationFormProps {
  orderId: string;
}

/**
 * The Order Detail view's one operational action (Everplans Money Prompt 7
 * Phase 3) - re-verifies this order against PayPal via the same shared,
 * idempotent logic every other caller uses. Never a client-side "mark as
 * paid" - this only ever submits the order's own id; every real decision
 * happens server-side in `retryOrderVerificationAction`.
 */
export function RetryVerificationForm({ orderId }: RetryVerificationFormProps) {
  const [state, formAction, isPending] = useActionState(retryOrderVerificationAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Verifying with PayPal…" : "Retry payment verification"}
        </Button>
        <Text size="body-sm" tone="faint">
          Re-checks this order with PayPal - never marks it paid without a real, verified response.
        </Text>
      </div>
      {state.status !== "idle" && (
        <Alert variant={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      )}
    </form>
  );
}

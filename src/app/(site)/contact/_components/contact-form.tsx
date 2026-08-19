"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { Alert, Button, Card, FormField, Heading, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Select } from "@/components/ui/form/select";
import { Textarea } from "@/components/ui/form/textarea";

import { submitContactForm, type ContactFormState } from "../actions";
import { CONTACT_REASONS, type ContactReason } from "../schema";

const initialState: ContactFormState = { status: "idle" };

interface ContactFormProps {
  /** Reason to pre-select - set when arriving from a `ContactOptions` link. */
  initialReason?: ContactReason;
}

export function ContactForm({ initialReason }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const focusedReason = useRef<ContactReason | undefined>(undefined);
  const errorAlertRef = useRef<HTMLDivElement>(null);

  // Pure side effect (DOM focus), no state to sync - the reason itself is
  // handled by keying <Select> on `initialReason` below (a prop-driven
  // remount resets an uncontrolled control the same way defaultValue does
  // on first mount), so this effect only ever needs to move focus, and only
  // once per distinct incoming reason - not on every unrelated re-render.
  useEffect(() => {
    if (initialReason && initialReason !== focusedReason.current) {
      focusedReason.current = initialReason;
      formRef.current?.focus();
    }
  }, [initialReason]);

  // Move focus to the error alert whenever a submission fails with a
  // non-field-specific error (network/server failure - the branch below
  // that actually renders the Alert), so keyboard and screen-reader users
  // land on the failure message immediately instead of having to find it
  // themselves. Field-validation errors deliberately skip this: each
  // invalid field already carries its own inline error via `FormField`,
  // which is the more useful place to land, and no Alert renders for that
  // case anyway. Keyed on `state` itself (a new object each time the action
  // resolves) so two consecutive failed submissions both re-focus, not just
  // the first - this never runs on mount or during normal typing/idle
  // state, only on an actual error transition.
  useEffect(() => {
    if (state.status === "error" && !state.fieldErrors) {
      errorAlertRef.current?.focus();
      errorAlertRef.current?.scrollIntoView({ block: "center" });
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <Card
        variant="elevated"
        padding="lg"
        className="animate-hero-in flex flex-col items-center gap-3 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-success-subtle">
          <CheckCircle2 className="size-6 animate-icon-pop text-success" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <Heading as="h3" size="h4">
          Message sent
        </Heading>
        <Text tone="muted" className="max-w-sm">
          Thanks for reaching out - we’ve received your message and will get back to you soon.
        </Text>
      </Card>
    );
  }

  return (
    <form
      ref={formRef}
      id="contact-form"
      tabIndex={-1}
      aria-label="Contact form"
      action={formAction}
      noValidate
    >
      <Card variant="elevated" padding="lg" className="flex flex-col gap-6">
        {state.status === "error" && !state.fieldErrors && (
          <Alert ref={errorAlertRef} tabIndex={-1} variant="error" title="Couldn't send your message">
            {state.message}
          </Alert>
        )}

        {/* Honeypot - invisible and unreachable for real visitors (aria-hidden,
            removed from tab order); a filled value signals automated submission. */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="company">Company</label>
          <input type="text" id="company" name="company" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Name" required error={state.fieldErrors?.name}>
            <Input name="name" type="text" autoComplete="name" placeholder="Jane Doe" />
          </FormField>
          <FormField label="Email" required error={state.fieldErrors?.email}>
            <Input name="email" type="email" autoComplete="email" placeholder="jane@example.com" />
          </FormField>
        </div>

        <FormField label="Reason" required error={state.fieldErrors?.reason}>
          <Select
            key={initialReason ?? "unselected"}
            name="reason"
            placeholder="Choose a reason"
            options={CONTACT_REASONS}
            defaultValue={initialReason}
          />
        </FormField>

        <FormField label="Message" required error={state.fieldErrors?.message} hint="At least 10 characters.">
          <Textarea name="message" placeholder="How can we help?" rows={6} />
        </FormField>

        <div className="border-t border-line-subtle pt-6">
          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            Send message
          </Button>
        </div>
      </Card>
    </form>
  );
}

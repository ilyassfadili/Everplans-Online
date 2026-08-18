"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { Alert, Button, Card, FormField, Heading, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Select } from "@/components/ui/form/select";
import { Textarea } from "@/components/ui/form/textarea";

import { submitContactForm, type ContactFormState } from "../actions";
import { CONTACT_REASONS } from "../schema";

const initialState: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (state.status === "success") {
    return (
      <Card variant="elevated" padding="lg" className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-success-subtle">
          <CheckCircle2 className="size-6 text-success" strokeWidth={1.75} aria-hidden="true" />
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
    <form action={formAction} noValidate>
      <Card variant="elevated" padding="lg" className="flex flex-col gap-6">
        {state.status === "error" && !state.fieldErrors && (
          <Alert variant="error" title="Couldn't send your message">
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
          <Select name="reason" placeholder="Choose a reason" options={CONTACT_REASONS} />
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

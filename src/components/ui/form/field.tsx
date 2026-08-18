import { cloneElement, isValidElement, useId, type ReactElement } from "react";

import { cn } from "@/lib/cn";
import { Label } from "./label";

interface ControlProps {
  id?: string;
  required?: boolean;
  invalid?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

interface FormFieldProps {
  label: string;
  /** Single form control (Input/Textarea/Select). Gets id/aria-* wired in automatically. */
  children: ReactElement<ControlProps>;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Wires a label, a control, and its hint/error text together correctly -
 * the same `id` on all three, `aria-describedby` pointing at whichever
 * message is showing, `aria-invalid` reflecting the error state - without
 * every call site re-deriving that wiring by hand and risking a mismatched
 * id. The error replaces the hint rather than stacking with it, so a field
 * never shows two conflicting messages at once.
 */
export function FormField({ label, children, hint, error, required, className }: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        required,
        // Both driven from the same `error` so visual (invalid) and
        // accessibility (aria-invalid) state can never drift apart.
        invalid: Boolean(error),
        "aria-invalid": Boolean(error),
        "aria-describedby": hasMessage ? messageId : undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {control}
      {error ? (
        <p id={messageId} role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-body-sm text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

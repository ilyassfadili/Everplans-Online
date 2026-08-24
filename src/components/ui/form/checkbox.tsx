import { Check } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

/**
 * A native `<input type="checkbox">`, not a div-based custom control - a
 * real checkbox already has the right semantics (keyboard toggling with
 * Space, `aria-checked` derived automatically, form participation) for
 * free, matching the "don't add ARIA where native HTML already provides
 * it" principle. Visually reskinned via `appearance-none` plus a check
 * icon shown through `peer-checked`, the same layering technique
 * `PasswordInput`'s show/hide toggle uses elsewhere in this system - the
 * underlying input stays the real interactive element throughout, CSS
 * only changes how it paints.
 *
 * Unlike `Input`/`Textarea`/`Select`, this doesn't route through
 * `FormField` - a checkbox's label sits beside it, not above it (see
 * `@/components/planner/generic-field.tsx` for the pairing), so call
 * sites wrap this in their own `<label>` rather than this component
 * managing that layout itself.
 */
export function Checkbox({ invalid, className, ...props }: CheckboxProps) {
  return (
    <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
      <input
        type="checkbox"
        className={cn(
          "peer size-5 shrink-0 appearance-none rounded border bg-surface",
          "transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
          "checked:border-brand checked:bg-brand",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-error" : "border-line-strong focus-visible:border-focus-ring",
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute size-3.5 text-ink-on-brand opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}

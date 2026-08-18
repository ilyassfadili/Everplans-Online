import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/*
  Form controls override the sitewide :focus-visible outline rather than
  add to it. That outline sits outside the border with a 2px offset - fine
  for a bare link or nav item, but on a field that already has its own
  border it reads as two disconnected rectangles ("un cadre"), not one
  cohesive focus state. A solid border-color change plus a soft ring that
  hugs the control's own radius reads as one deliberate state instead - the
  border still carries the accessible contrast (same verified focus-ring
  token, full opacity), the ring is purely additive glow.
*/
const controlBase =
  "w-full rounded-md border bg-surface px-3.5 text-body text-ink placeholder:text-ink-faint " +
  "transition-[color,box-shadow,border-color] duration-150 ease-standard " +
  "focus-visible:outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-disabled";

export function inputClassName(invalid: boolean | undefined, className?: string) {
  return cn(controlBase, "h-11", invalid ? "border-error" : "border-line-strong", className);
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      className={inputClassName(invalid, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

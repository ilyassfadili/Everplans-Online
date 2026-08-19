"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes } from "react";

import { inputClassName } from "./input";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

/**
 * A password field with a visibility toggle. The toggle is a real labeled
 * button (`aria-label` swaps with the state, `aria-pressed` reflects it) -
 * never an icon alone, so it's meaningful to a screen reader, not just a
 * sighted user.
 */
export function PasswordInput({ invalid, className, id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={inputClassName(invalid, `pr-11 ${className ?? ""}`)}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded text-ink-faint transition-colors duration-150 ease-standard hover:text-ink-muted"
      >
        {visible ? (
          <EyeOff key="off" className="size-4 animate-icon-pop" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Eye key="on" className="size-4 animate-icon-pop" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

import type { TextareaHTMLAttributes } from "react";

import { inputClassName } from "./input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={inputClassName(invalid, `h-auto resize-y py-3 ${className ?? ""}`)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

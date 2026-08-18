import type { LabelHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label className={cn("text-body-sm font-medium text-ink", className)} {...props}>
      {children}
      {required && (
        <>
          <span aria-hidden="true" className="text-error">
            {" "}
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      )}
    </label>
  );
}

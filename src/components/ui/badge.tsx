import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-ink-muted",
        brand: "bg-accent-subtle text-brand",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        error: "bg-error-subtle text-error",
        outline: "border border-line text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  children: ReactNode;
}

/** A small status/category label - category tags, "Coming soon", form field states. */
export function Badge({ variant, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

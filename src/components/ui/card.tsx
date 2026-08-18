import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

const cardVariants = cva("rounded-lg", {
  variants: {
    variant: {
      // Sits on canvas with a hairline border - no shadow. The default;
      // most content grouping needs definition, not elevation.
      standard: "bg-surface border border-line-subtle",
      // Genuinely raised above the page - reserve for content that should
      // visually float (a featured callout), not routine grouping.
      elevated: "bg-surface border border-line-subtle shadow-md",
      // A standard surface that also responds to hover/focus because the
      // whole card is a single interactive target (wrap it in a Link/button).
      // The hover lift is a transform, not an animation, so the sitewide
      // reduced-motion rule (which zeroes transition-duration) already makes
      // it a snap instead of an ease for anyone who's asked for that.
      interactive:
        "bg-surface border border-line-subtle transition-all duration-200 ease-standard hover:-translate-y-1 hover:border-line hover:shadow-md focus-within:border-line-strong",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "standard",
    padding: "md",
  },
});

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  as?: ElementType;
  children: ReactNode;
}

export function Card({ as: Component = "div", variant, padding, className, children, ...props }: CardProps) {
  return (
    <Component className={cn(cardVariants({ variant, padding }), className)} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-body-lg font-semibold text-ink", className)} {...props}>
      {children}
    </p>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-body-sm text-ink-muted", className)} {...props}>
      {children}
    </p>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 flex items-center gap-3", className)} {...props}>
      {children}
    </div>
  );
}

import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode, Ref } from "react";

import { cn } from "@/lib/cn";

const alertVariants = cva("flex gap-3 rounded-md border p-4", {
  variants: {
    variant: {
      info: "border-line bg-surface-muted text-ink",
      success: "border-success/20 bg-success-subtle text-ink",
      warning: "border-warning/20 bg-warning-subtle text-ink",
      error: "border-error/20 bg-error-subtle text-ink",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const iconToneClass = {
  info: "text-ink-muted",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
} as const;

const variantIcon: Record<NonNullable<VariantProps<typeof alertVariants>["variant"]>, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  children: ReactNode;
  /** React 19 accepts `ref` as a plain prop on function components - no `forwardRef` needed. */
  ref?: Ref<HTMLDivElement>;
}

/** Inline feedback banner - form-level status, page-level notices. Not a toast. */
export function Alert({ variant, title, className, children, ref, ...props }: AlertProps) {
  const resolvedVariant = variant ?? "info";
  const VariantIcon = variantIcon[resolvedVariant];
  return (
    <div
      ref={ref}
      role={resolvedVariant === "error" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <VariantIcon
        className={cn("mt-0.5 size-5 shrink-0", iconToneClass[resolvedVariant])}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-0.5">
        {title && <p className="text-body-sm font-semibold text-ink">{title}</p>}
        <div className="text-body-sm text-ink-muted">{children}</div>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

const sizeClass = { sm: "size-4", md: "size-5", lg: "size-7" } as const;

interface SpinnerProps {
  size?: keyof typeof sizeClass;
  className?: string;
  /** Accessible description of what's loading. Omit inside a button that already has a label. */
  label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} aria-live={label ? "polite" : undefined}>
      <Loader2 className={cn(sizeClass[size], "animate-spin text-current", className)} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

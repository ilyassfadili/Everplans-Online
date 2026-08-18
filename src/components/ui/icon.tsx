import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

const iconSizeClass = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof iconSizeClass;
  className?: string;
  /** A label makes the icon convey meaning to screen readers; omit for purely decorative icons (the default). */
  label?: string;
}

/**
 * Standardizes every icon in the app to the same stroke weight and one of
 * three sizes, so icons from different call sites always look like one
 * family. Import icons from `lucide-react` and pass them here rather than
 * rendering them directly with ad-hoc size/strokeWidth props.
 *
 * Decorative by default (`aria-hidden`). Pass `label` when the icon is the
 * only content conveying meaning (e.g. inside an icon-only button).
 */
export function Icon({ icon: LucideIconComponent, size = "md", className, label }: IconProps) {
  return (
    <LucideIconComponent
      className={cn(iconSizeClass[size], className)}
      strokeWidth={1.75}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    />
  );
}

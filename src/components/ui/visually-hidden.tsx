import type { HTMLAttributes, ReactNode } from "react";

/**
 * Content present for assistive technology only - visually clipped but
 * still in the accessibility tree. Used for icon-only button labels, skip
 * links, and context that's visually obvious but not textually present
 * (e.g. "(current page)").
 */
export function VisuallyHidden({
  as: Component = "span",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: "span" | "div"; children: ReactNode }) {
  return (
    <Component className="sr-only" {...props}>
      {children}
    </Component>
  );
}

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type HeadingTag = "h1" | "h2" | "h3" | "h4";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  /**
   * Renders `title` as this heading level instead of a plain paragraph.
   * Set it whenever this is the only heading for its section (as on Home's
   * "Featured planner" section) - omit it when a heading already precedes
   * this component and the title is purely supporting text, so the page
   * doesn't end up with two headings for one section.
   */
  titleAs?: HeadingTag;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * The shared "there is nothing here yet, and that's intentional" surface -
 * an empty planner catalog, an empty category list, a blog with no posts.
 * Deliberately calm rather than apologetic: no "Oops", no error styling,
 * no implication that something is broken. One primitive used everywhere
 * this situation occurs, so the empty ecosystem always reads as one
 * consistent design decision instead of several ad-hoc placeholders.
 */
export function EmptyState({
  icon: IconComponent,
  title,
  titleAs: TitleTag,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-dashed border-line bg-surface-muted/40 px-6 py-16 text-center",
        className,
      )}
    >
      {IconComponent && (
        <div className="flex size-12 items-center justify-center rounded-full bg-accent-subtle text-brand">
          <IconComponent className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      <div className="flex max-w-md flex-col gap-1.5">
        {TitleTag ? (
          <TitleTag className="text-body-lg font-semibold text-ink">{title}</TitleTag>
        ) : (
          <p className="text-body-lg font-semibold text-ink">{title}</p>
        )}
        {description && <p className="text-body-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

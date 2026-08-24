import type { ReactNode } from "react";

import { Heading, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** A page-level primary/secondary action, rendered beside the description on wide viewports and beneath it on narrow ones. None of today's Dashboard section pages need one yet - each page's real actions live closer to their own content (a card's own CTA, Help's Contact Support card) - but the shape exists for whichever future page genuinely needs a page-level action instead of a content-level one. */
  action?: ReactNode;
  className?: string;
}

/**
 * The shared page-intro block (Dashboard V2 Prompt 4 Phase 1 §4) - a
 * title above a description, the exact same two-line block, repeated
 * verbatim, across seven pages (`/app/planners`, `/app/analytics`,
 * `/app/activity`, `/app/store`, `/app/resources`, `/app/help`,
 * `/app/settings`).
 *
 * `title` renders `hidden lg:block` - not because the title stops being
 * this page's real `<h1>` below `lg`, but because `DashboardMobileNav`'s
 * own sticky bar already renders that exact same route title as its own
 * `<h1>` (`DashboardHeaderTitle`, `variant="mobile"`) below that
 * breakpoint; showing it a second time in the content immediately below
 * would be the same page name twice in one view. Above `lg`, the Header
 * carries no title of its own (live feedback: "the title must not be in
 * the header, must be like the old version") - it belongs to the page
 * content again, the same place `WorkspaceWelcome`'s greeting already
 * lives for `/app` itself, one `<h1>` per route either way, just handed
 * off between two different places depending on viewport rather than
 * rendered twice.
 *
 * Deliberately not used by `/app` itself: that page's own content is
 * `WorkspaceWelcome`, a personalized greeting ("Welcome back, [name]"),
 * genuinely different content from a static section title.
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Heading as="h1" size="h2" className="hidden lg:block">
        {title}
      </Heading>
      {(description || action) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {description && (
            <Text size="body-lg" tone="muted" className="max-w-xl">
              {description}
            </Text>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </div>
  );
}

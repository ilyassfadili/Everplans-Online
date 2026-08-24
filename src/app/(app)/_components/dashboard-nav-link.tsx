"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface DashboardNavLinkProps {
  href: string;
  label: string;
  /** A fully-rendered icon element, not a `LucideIcon` component reference - see this file's own comment on why. */
  icon: ReactNode;
  onNavigate?: () => void;
}

/**
 * One Dashboard nav item, aware of whether it's the current section - the
 * authenticated-app counterpart to the public site's `NavLink`
 * (`@/components/site/nav-link.tsx`), same reasoning: isolated as its own
 * small Client Component because `usePathname()` is the only thing here
 * that needs the browser, so the sidebar/drawer shells around it can stay
 * server-rendered.
 *
 * Takes `icon: ReactNode`, not the raw `DashboardNavItem` (which carries
 * a `LucideIcon` component reference) - React Server Components cannot
 * pass a component/function reference as prop data across the server→
 * client boundary ("Only plain objects can be passed to Client Components
 * from Server Components... Classes or other objects with methods are
 * not supported"), only already-rendered elements or plain serializable
 * values. `DashboardNavSections` (still a Server Component) renders the
 * icon itself and hands this component the finished JSX, which crosses
 * the boundary fine - a React element tree is exactly what `children`/
 * element props are built to carry.
 *
 * The active-state icon color is applied via a `group-aria-[current=page]`
 * Tailwind variant on the icon's own class list, not by branching in this
 * component's logic - the icon element is constructed once, server-side,
 * before `isCurrent` is even knowable (that's a client-only fact, derived
 * from `usePathname()`), and its color then reacts purely to whether its
 * ancestor `<NextLink>` (marked `group`) carries `aria-current="page"` at
 * paint time. No re-render, no second source of truth for the color.
 *
 * Uses `next/link` directly rather than the shared `@/components/ui`
 * `Link` - none of that component's existing variants (`inline`, `nav`,
 * `prominent`, `subtle`) match this treatment (an icon-led row with a
 * pill-shaped active background, not an underlined text link), and
 * layering ad-hoc overrides on top of `variant="nav"`'s own color classes
 * would just be two competing style sources for the same states. A fully
 * self-contained class list here is clearer than a partial override.
 *
 * Prefix-matches like the public `NavLink` does (`/app/planners` stays
 * current on `/app/planners/some-slug`), not exact-match only - a
 * detail page is still "inside" the section its listing belongs to.
 */
export function DashboardNavLink({ href, label, icon, onNavigate }: DashboardNavLinkProps) {
  const pathname = usePathname();
  const isCurrent = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <NextLink
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-body-sm transition-colors duration-150 ease-standard",
        // Ring-only focus treatment (no `border-focus-ring` companion,
        // unlike form controls) - this element has no border to recolor,
        // so a border-color utility here would compile to a real class
        // with zero visible effect. The ring alone is a complete,
        // clearly visible focus indicator on a borderless element.
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring/15",
        isCurrent
          ? "bg-accent-subtle font-medium text-brand"
          : "text-ink-muted hover:bg-surface-muted hover:text-ink",
      )}
    >
      {icon}
      {label}
    </NextLink>
  );
}

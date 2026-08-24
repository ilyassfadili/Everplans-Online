"use client";

import { Check, ChevronDown, ChevronsUpDown, Plus } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PlannerWorkspace } from "@/types/planner-workspace";

import { DashboardNavLink } from "./dashboard-nav-link";
import { PLANNER_WORKSPACE_ICONS } from "./planner-workspace-icons";

interface PlannerWorkspaceNavProps {
  workspaces: PlannerWorkspace[];
  /** Only ever supplied by the mobile drawer, to close itself after a link is clicked - see `DashboardNavSections`'s own comment on the same convention. */
  onNavigate?: () => void;
}

/**
 * The Planner Switcher plus the currently-selected workspace's contextual
 * nav - Phase 1's "Active Planner Navigation," replacing what used to be a
 * hardcoded "Wedding" section in `@/config/dashboard-nav`. A Client
 * Component (not `DashboardNavSections`'s Server Component split) because
 * "which workspace is active" is itself a `usePathname()` question, the
 * same reason `DashboardNavLink` is already isolated this way - the
 * switcher and the nav items beneath it both need that answer, so they
 * share one component rather than each re-deriving it.
 *
 * `workspaces` is real, per-user data (`getUserPlannerWorkspaces()`,
 * `@/lib/planner-workspaces`) fetched once in `AppLayout` and passed down
 * as plain, serializable props - never a `LucideIcon` reference (see
 * `@/types/planner-workspace`'s own comment on why) and never fetched a
 * second time client-side.
 *
 * Three states, matching Phase 1 §1/§3/§4 exactly:
 * - Zero workspaces: renders nothing. No fake planner nav, no switcher -
 *   `dashboardNav`'s own "Discover" → Store section is the existing
 *   discovery path this falls back to.
 * - One workspace: a disclosure button styled the same as the switcher
 *   trigger, minus its popover - collapses/expands the workspace's own
 *   subnav in place (see `navExpanded` below). No icon and no separate
 *   "go to workspace home" affordance on the trigger itself - `navItems`
 *   always starts with a "Dashboard" entry pointing at `active.href`
 *   (`getUserPlannerWorkspaces`, `@/lib/planner-workspaces`), so that link
 *   already covers it; the trigger's only job is naming the workspace and
 *   toggling its subnav. A small "Browse other planners" icon-link sits
 *   beside it either way - owning exactly one planner shouldn't mean this
 *   block is a dead end once you want a second.
 * - Multiple workspaces: a real disclosure button + popover, the same
 *   click-outside/Escape/`aria-expanded` mechanics `AccountMenu`/
 *   `NotificationsMenu` already establish (`role="region"`, plain links,
 *   no `role="menu"`/roving `tabindex` - see `UserProfileMenu`'s own
 *   comment on preferring native semantics over ARIA menu patterns). The
 *   popover itself ends with the same "Browse other planners" link,
 *   separated by a divider, below the real owned planners it lists above.
 *   Both destinations point at `/app/store` - the real composed listing of
 *   every hand-built product (Wedding, Budget, ...) plus the generic
 *   catalog (`store/page.tsx`'s own comment) - never `/app/planners`, which
 *   only reads the still-empty generic catalog on its own. A *second*,
 *   separate chevron button sits beside the switcher trigger here (the
 *   `ChevronsUpDown` trigger only ever opens the switcher popover) so
 *   showing/hiding the active planner's own page list doesn't require
 *   opening "change planner" first - the same `navExpanded` toggle the
 *   one-workspace case already has, just reachable independently of the
 *   switcher once there's more than one planner to switch between.
 *
 * The whole section - trigger plus (when expanded) the active workspace's
 * subnav - sits inside one bordered "cadre" (`rounded-lg border`, same
 * treatment `Card`'s `standard` variant uses) so a user's own planner(s)
 * read as a distinct, self-contained block against the rest of the nav
 * rail rather than blending into the plain link list around it.
 *
 * "Active" workspace is a prefix match against `pathname` (the same
 * convention `DashboardNavLink` uses for its own active state), falling
 * back to the first workspace when the current route belongs to neither
 * (e.g. `/app/settings`) - so the contextual nav for a user's one planner
 * stays visible everywhere, not just on that planner's own routes, matching
 * the behavior the old hardcoded "Wedding" section already had.
 */
export function PlannerWorkspaceNav({ workspaces, onNavigate }: PlannerWorkspaceNavProps) {
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  // Independent of `switcherOpen`: whether the active workspace's own
  // subnav (Checklist/Timeline/Budget/...) is showing. Starts expanded so
  // a first-time visitor's subnav isn't hidden behind an extra click; the
  // switcher popover (a different, browse-other-planners interaction)
  // starts closed instead.
  const [navExpanded, setNavExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const switcherPanelId = useId();
  const navPanelId = useId();

  useEffect(() => {
    if (!switcherOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSwitcherOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [switcherOpen]);

  if (workspaces.length === 0) return null;

  const active =
    workspaces.find((workspace) => pathname === workspace.href || pathname.startsWith(`${workspace.href}/`)) ??
    workspaces[0]!;

  function selectWorkspace() {
    setSwitcherOpen(false);
    onNavigate?.();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-2">
      {workspaces.length > 1 ? (
        <div ref={containerRef} className="relative flex items-center gap-1">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setSwitcherOpen((value) => !value)}
            aria-expanded={switcherOpen}
            aria-controls={switcherPanelId}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-body-sm font-semibold text-ink transition-colors duration-150 ease-standard hover:bg-surface-muted"
          >
            <span className="min-w-0 flex-1 truncate text-left">{active.name}</span>
            <Icon
              icon={ChevronsUpDown}
              size="sm"
              className="shrink-0 text-ink-faint transition-transform duration-150 ease-standard"
            />
            <span className="sr-only">{switcherOpen ? "Close planner switcher" : "Switch planner"}</span>
          </button>

          {/* A second, independent toggle - the trigger above switches
              *which* planner is active; this one shows/hides the active
              planner's own page list (Checklist/Timeline/Budget/...)
              without touching the switcher popover at all. */}
          {active.navItems.length > 0 && (
            <button
              type="button"
              onClick={() => setNavExpanded((value) => !value)}
              aria-expanded={navExpanded}
              aria-controls={navPanelId}
              className="flex shrink-0 items-center justify-center rounded-md p-2 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
            >
              <Icon
                icon={ChevronDown}
                size="sm"
                className={cn("transition-transform duration-150 ease-standard", navExpanded && "rotate-180")}
              />
              <span className="sr-only">{navExpanded ? "Hide pages" : "Show pages"}</span>
            </button>
          )}

          {switcherOpen && (
            <div
              id={switcherPanelId}
              role="region"
              aria-label="Your planners"
              className="absolute left-0 top-full z-20 mt-2 w-full min-w-[14rem] rounded-lg border border-line-subtle bg-surface p-1.5 shadow-lg"
            >
              {workspaces.map((workspace) => {
                const isSelected = workspace.id === active.id;
                return (
                  <NextLink
                    key={workspace.id}
                    href={workspace.href}
                    aria-current={isSelected ? "true" : undefined}
                    onClick={selectWorkspace}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm transition-colors duration-150 ease-standard",
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring/15",
                      isSelected ? "bg-accent-subtle font-medium text-brand" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                    )}
                  >
                    <Icon icon={PLANNER_WORKSPACE_ICONS[workspace.iconKey]} size="sm" className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                    {isSelected && <Icon icon={Check} size="sm" className="shrink-0 text-brand" />}
                  </NextLink>
                );
              })}
              <div className="mt-1 border-t border-line-subtle pt-1">
                <NextLink
                  href="/app/store"
                  onClick={selectWorkspace}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
                >
                  <Icon icon={Plus} size="sm" className="shrink-0" />
                  Browse other planners
                </NextLink>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setNavExpanded((value) => !value)}
            aria-expanded={navExpanded}
            aria-controls={navPanelId}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-body-sm font-semibold text-ink transition-colors duration-150 ease-standard hover:bg-surface-muted"
          >
            <span className="min-w-0 flex-1 truncate text-left">{active.name}</span>
            <Icon
              icon={ChevronDown}
              size="sm"
              className={cn(
                "shrink-0 text-ink-faint transition-transform duration-150 ease-standard",
                navExpanded && "rotate-180",
              )}
            />
            <span className="sr-only">{navExpanded ? "Hide pages" : "Show pages"}</span>
          </button>
          <NextLink
            href="/app/store"
            onClick={onNavigate}
            aria-label="Browse other planners"
            title="Browse other planners"
            className="flex shrink-0 items-center justify-center rounded-md p-2 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
          >
            <Icon icon={Plus} size="sm" />
          </NextLink>
        </div>
      )}

      {navExpanded && active.navItems.length > 0 && (
        <ul id={navPanelId} className="flex flex-col gap-0.5 animate-accordion-reveal">
          {active.navItems.map((item) => (
            <li key={item.href}>
              <DashboardNavLink
                href={item.href}
                label={item.label}
                icon={
                  <Icon
                    icon={PLANNER_WORKSPACE_ICONS[item.iconKey]}
                    size="sm"
                    className="text-ink-faint group-aria-[current=page]:text-brand"
                  />
                }
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

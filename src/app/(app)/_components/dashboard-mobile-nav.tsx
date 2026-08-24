"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/cn";
import type { Notification } from "@/types/notification";
import type { PlannerWorkspace } from "@/types/planner-workspace";

import { AccountMenu } from "./account-menu";
import { DashboardHeaderTitle } from "./dashboard-header-title";
import { DashboardNavSections } from "./dashboard-nav-sections";
import { NotificationsMenu } from "./notifications-menu";
import { PlannerWorkspaceNav } from "./planner-workspace-nav";
import { UserProfileMenu } from "./user-profile-menu";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DashboardMobileNavProps {
  displayName: string | null;
  email?: string;
  avatarUrl?: string | null;
  /** Same real, per-user planner list `DashboardSidebar` receives - see that prop's own comment. */
  workspaces: PlannerWorkspace[];
  /** Same real (currently always-empty) list `DashboardTopbar` fetches for its own `NotificationsMenu` - see that component's own comment. Fetched once in `AppLayout` and passed down, not fetched a second time here. */
  notifications: Notification[];
}

/**
 * The mobile/tablet counterpart to `DashboardSidebar` - Phase 1 §5's
 * "mobile navigation foundation," Phase 2 §4's explicit requirements
 * (easy access, clear current location, accessible menu interaction,
 * comfortable touch targets, no overflow/clipping). A slide-in drawer
 * from the left (where the sidebar would sit at `lg`+), not a top-down
 * dropdown - a dashboard's own navigation reads more naturally as "the
 * sidebar, temporarily overlaid" than as a simple link list, unlike the
 * public site's own `MobileMenu`, which this still borrows its
 * accessibility mechanics from almost verbatim (focus trap, Escape,
 * scroll lock, focus restore, always-mounted + `inert` for a genuine
 * close transition) - proven, already-reviewed patterns, not reinvented.
 *
 * `lg:hidden`: this renders nothing at `lg`+, the same clean handoff
 * `DashboardSidebar` makes in the other direction - never both mounted
 * as live, interactive regions at the same viewport width.
 *
 * The sticky bar itself is the mobile Header (Header Prompt §8): menu
 * trigger, current-page title (`DashboardHeaderTitle`, centered - no room
 * for a subtitle here, see that component's own comment), and the
 * account control, in that order. It no longer carries the wordmark `Logo`
 * that used to sit where the title now does - Header Prompt §8 is explicit
 * that the mobile Header's three slots are menu / context / account, with
 * nothing else competing for the limited width; the mark still appears
 * one tap away, atop the drawer this button opens.
 *
 * `NotificationsMenu` sits just before the account control, with the same
 * thin divider separating the two, mirroring `DashboardTopbar`'s desktop
 * layout exactly (notifications, divider, account) - the mobile bell is
 * the same component, the same real (currently always-empty) data, not a
 * simplified or second notifications UI for this width.
 */
export function DashboardMobileNav({ displayName, email, avatarUrl, workspaces, notifications }: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line-subtle bg-surface/85 px-4 backdrop-blur-md sm:px-8">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-ink transition-colors duration-150 ease-standard hover:bg-surface-muted"
        >
          {open ? (
            <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>

        <div className="min-w-0 flex-1">
          <DashboardHeaderTitle variant="mobile" />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <NotificationsMenu notifications={notifications} />
          <div aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-line-subtle" />
          <AccountMenu displayName={displayName} email={email} avatarUrl={avatarUrl} compact />
        </div>
      </header>

      {/* Always mounted (see MobileMenu's own comment on why), so both
          open and close animate. `inert` removes the closed panel from
          tab order/hit-testing in one attribute. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
        inert={!open}
        className={cn(
          "fixed inset-0 z-40 bg-overlay transition-opacity duration-200 ease-standard",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard navigation"
        inert={!open}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-line-subtle bg-surface shadow-lg",
          "transition-transform duration-200 ease-standard motion-reduce:transition-none",
          open ? "translate-x-0" : "pointer-events-none -translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line-subtle px-4">
          <Logo href="/app" />
          <button
            type="button"
            onClick={close}
            className="inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors duration-150 ease-standard hover:bg-surface-muted"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <nav aria-label="Dashboard" className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-6">
            <PlannerWorkspaceNav workspaces={workspaces} onNavigate={close} />
            <DashboardNavSections onNavigate={close} />
          </div>
        </nav>

        <div className="shrink-0 border-t border-line-subtle p-4">
          <UserProfileMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
        </div>
      </div>
    </div>
  );
}

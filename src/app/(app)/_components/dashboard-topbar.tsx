import type { Notification } from "@/types/notification";

import { AccountMenu } from "./account-menu";
import { DashboardSearch } from "./dashboard-search";
import { NotificationsMenu } from "./notifications-menu";

interface DashboardTopbarProps {
  displayName: string | null;
  email?: string;
  avatarUrl?: string | null;
  /** Fetched once in `AppLayout` and shared with `DashboardMobileNav`'s own `NotificationsMenu` - see that component's own comment. */
  notifications: Notification[];
}

/**
 * The desktop Header - a minimal utility bar, not a second place the
 * page title lives (live feedback: "the title must not be in the
 * header, must be like the old version, up of the subtitle"). Each
 * route's real `<h1>` moved back to the page content (`PageHeader`,
 * `WorkspaceWelcome`) - this bar carries only search, notifications, and
 * account access, left and right, the same two-sided shape it had before
 * a title was ever added here.
 *
 * `hidden lg:flex`: the same clean breakpoint handoff every other piece
 * of this shell uses - `DashboardMobileNav`'s own sticky header still
 * carries the route title below `lg` (there's no page-content title to
 * hand off to at that width - `PageHeader`'s own title is `hidden`
 * there for exactly that reason), so the two bars are never both
 * mounted as live regions at once, and there's still only one visible
 * `<h1>` per route at any viewport.
 *
 * Search is no longer gated behind `xl:` - with the title gone there's
 * room for it at every width this bar renders at (`lg:` and up).
 *
 * `notifications` comes from the `(app)` layout, the same already-fetched
 * value `DashboardMobileNav`'s own `NotificationsMenu` receives - one real
 * `getNotifications()` call per request, not a second one just for this
 * bar. `displayName`/`email` come from the same layout for the same
 * reason - no second profile fetch just for this bar's own account
 * control.
 */
export function DashboardTopbar({ displayName, email, avatarUrl, notifications }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between gap-6 border-b border-line-subtle bg-surface/85 px-4 backdrop-blur-md sm:px-8 lg:flex lg:px-12">
      <div className="w-full max-w-xs">
        <DashboardSearch />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationsMenu notifications={notifications} />
        <div aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-line-subtle" />
        <AccountMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}

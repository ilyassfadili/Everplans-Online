import type { ReactNode } from "react";

import { SkipLink } from "@/components/site/skip-link";
import { requireUser } from "@/lib/auth/dal";
import { getNotifications } from "@/lib/notifications";
import { getUserPlannerWorkspaces } from "@/lib/planner-workspaces";
import { getUserProfile } from "@/lib/profile";

import { DashboardMobileNav } from "./_components/dashboard-mobile-nav";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { DashboardTopbar } from "./_components/dashboard-topbar";

/**
 * Shell for the authenticated customer application - Dashboard V2's
 * sidebar-led shell, replacing the earlier single top-header layout
 * (the old `AppHeader` this file used to render is gone; its identity/
 * profile responsibilities live in `DashboardSidebar` (desktop) and
 * `DashboardMobileNav` (mobile/tablet) - never both mounted as live
 * regions at the same viewport width, see either component's own
 * comment). `DashboardTopbar` is `DashboardMobileNav`'s desktop
 * counterpart for the one thing the sidebar doesn't cover - search and
 * notifications - with the same clean `lg` handoff. Deliberately its own
 * root, parallel to `(site)` and `(auth)`, not a variant of either - the
 * public Header/Footer/nav belong to the marketing site; nothing about
 * this shell reuses or extends them.
 *
 * `requireUser()` is the real gate, not `proxy.ts`'s optimistic redirect -
 * see `src/lib/auth/dal.ts`. Calling it here means every route under
 * `(app)` is protected by construction: a new page added under this
 * layout can't forget the check, because the layout already performed it
 * before that page's own code runs. Individual pages/Server
 * Actions/Route Handlers that fetch user-specific *data* should still
 * call `requireUser()` (or `getCurrentUser()`) themselves rather than
 * assuming this layout ran - see the DAL's own comment for why.
 *
 * `getUserProfile()` is called here too, not just on `/app` itself - the
 * sidebar/mobile-nav's own profile area (Phase 1 §6), and now
 * `DashboardTopbar`'s own account control (Header Prompt §2/§11), need
 * the same display name and avatar initials on every authenticated
 * route, not just the dashboard home. `getCurrentUser()`'s `cache()`
 * wrapping means this and any page-level `requireUser()`/`getUserProfile()`
 * call collapse into one real network round trip per request, not two.
 *
 * `getUserPlannerWorkspaces()` (`@/lib/planner-workspaces`) is fetched
 * here for the same reason - the Planner Switcher (`PlannerWorkspaceNav`,
 * rendered inside both `DashboardSidebar` and `DashboardMobileNav`) needs
 * to know which planners the current user actually has on every
 * authenticated route, not derived per-page. Fetched once and passed down
 * as a plain, serializable prop to both - never fetched again inside
 * either component, and never a `LucideIcon` reference crossing into
 * `DashboardMobileNav`'s Client Component tree (see
 * `@/types/planner-workspace`'s own comment on why that would break).
 *
 * `getNotifications()` (`@/lib/notifications`) is fetched here too, for the
 * same reason again: `NotificationsMenu` now renders in both
 * `DashboardTopbar` (desktop) and `DashboardMobileNav` (mobile) - one real
 * bell with one real (currently always-empty) data source, fetched once and
 * passed to both, not two independent fetches that could momentarily
 * disagree.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [profile, workspaces, notifications] = await Promise.all([
    getUserProfile(),
    getUserPlannerWorkspaces(),
    getNotifications(),
  ]);
  const displayName = profile?.displayName ?? null;
  const avatarUrl = profile?.avatarUrl ?? null;

  return (
    <>
      <SkipLink />
      <div className="flex min-h-dvh bg-canvas">
        <DashboardSidebar displayName={displayName} email={user.email} avatarUrl={avatarUrl} workspaces={workspaces} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardMobileNav
            displayName={displayName}
            email={user.email}
            avatarUrl={avatarUrl}
            workspaces={workspaces}
            notifications={notifications}
          />
          <DashboardTopbar displayName={displayName} email={user.email} avatarUrl={avatarUrl} notifications={notifications} />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

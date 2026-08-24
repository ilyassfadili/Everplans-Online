import { Logo } from "@/components/site/logo";
import type { PlannerWorkspace } from "@/types/planner-workspace";

import { DashboardNavSections } from "./dashboard-nav-sections";
import { PlannerWorkspaceNav } from "./planner-workspace-nav";
import { UserProfileMenu } from "./user-profile-menu";

interface DashboardSidebarProps {
  displayName: string | null;
  email?: string;
  avatarUrl?: string | null;
  /** The current user's real planner workspaces (`getUserPlannerWorkspaces()`, fetched once in `AppLayout`) - see `PlannerWorkspaceNav`'s own comment for the zero/one/multiple states this drives. */
  workspaces: PlannerWorkspace[];
}

/**
 * The desktop navigation shell - Phase 1 §2's "sidebar/navigation region"
 * and "user account/profile area," Phase 2 §1's stable, visually-balanced
 * desktop composition. `hidden lg:flex`: below `lg` this renders nothing
 * at all (not just visually hidden - `DashboardMobileNav` is the mobile
 * counterpart and owns that range entirely, so there's never a moment
 * where both a sidebar and a mobile drawer exist in the DOM at once).
 *
 * A plain Server Component - no interactivity of its own. The client-side
 * pieces inside it are `PlannerWorkspaceNav` (the Planner Switcher plus
 * the active workspace's contextual nav) and `DashboardNavLink` (via
 * `DashboardNavSections`), isolated exactly the way the public site's own
 * `Header`/`NavLink` split already works, for the same reason: only the
 * active-route check needs the browser.
 *
 * Fixed `w-64` (16rem) - stable and predictable at every desktop width
 * Phase 1 §7/Phase 2 §1 ask for, never fluid or content-driven, so page
 * content's own available width doesn't shift as different pages render
 * different amounts of nav-adjacent content.
 *
 * `lg:sticky lg:top-0 lg:h-dvh` (live feedback: the sidebar was scrolling
 * away with the page on a tall route like Settings, instead of staying in
 * place the way a dashboard rail is expected to) - pinned to the viewport
 * regardless of how long `main` runs, the same "the nav is always where
 * you left it" behavior `DashboardTopbar`'s own `sticky top-0` already
 * gives the header.
 *
 * `nav` is *not* `flex-1` (live feedback: on a short nav and a tall
 * screen, stretching it to fill the rail pushed the profile footer all
 * the way to the bottom and left a large, unexplained empty gap between
 * the last nav item and the account block). It sizes to its own content
 * instead, so the profile footer sits directly beneath the nav items;
 * any leftover height in a tall `lg:h-dvh` rail now shows up as quiet
 * background below the footer, not as a gap sandwiched inside the
 * content. `overflow-y-auto` stays on `nav` regardless, so a nav list
 * that someday outgrows a short viewport still scrolls internally rather
 * than pushing the footer off-screen. `no-scrollbar` (`globals.css`) hides
 * the scrollbar chrome itself (live feedback: Windows' classic,
 * always-reserved scrollbar read as heavy next to a four-item nav that
 * essentially never needs it) - the region still scrolls by wheel/touch/
 * keyboard, only the visible track/thumb is gone.
 */
export function DashboardSidebar({ displayName, email, avatarUrl, workspaces }: DashboardSidebarProps) {
  return (
    <aside className="hidden shrink-0 flex-col border-r border-line-subtle bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64">
      <div className="shrink-0 p-6">
        <Logo href="/app" />
      </div>

      <nav aria-label="Dashboard" className="no-scrollbar min-h-0 overflow-y-auto px-3 pb-6">
        <div className="flex flex-col gap-6">
          <PlannerWorkspaceNav workspaces={workspaces} />
          <DashboardNavSections />
        </div>
      </nav>

      <div className="shrink-0 border-t border-line-subtle p-4">
        <UserProfileMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
      </div>
    </aside>
  );
}

import { Activity, BarChart3, BookOpen, CircleHelp, NotebookPen, Receipt, Settings, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Single source of truth for the authenticated Dashboard's *static*
 * navigation - the sections that exist regardless of which planners (if
 * any) the current user has: Workspace, Discover, Support, Account. The
 * Sidebar (desktop) and the mobile drawer both read from this rather than
 * each maintaining their own list, the same reasoning
 * `@/config/navigation.ts` already applies to the public site's nav.
 *
 * The Wedding Planner's own section used to be hardcoded here,
 * unconditionally, ahead of "Workspace" - that broke down once a user
 * could genuinely have zero planners (it rendered Wedding's full nav even
 * for someone who'd never onboarded) or, eventually, more than one.
 * That's now `PlannerWorkspaceNav`
 * (`@/app/(app)/_components/planner-workspace-nav.tsx`), driven by
 * `getUserPlannerWorkspaces()` (`@/lib/planner-workspaces`) - real
 * per-user data, not static config, since "which planners does this user
 * have" can only be answered per request. This file stays the single
 * source of truth for everything that isn't planner-contextual.
 *
 * Every `href` here is a real route - either one that already exists
 * with real functionality (`/app/planners`, built in an earlier phase),
 * or a new minimal placeholder route this same prompt adds (see each
 * route's own `page.tsx` under `src/app/(app)/app/*`, all rendering the
 * shared `SectionPlaceholder`). None of these are dead links or `href="#"`
 * stand-ins - "establish the architecture necessary for future
 * navigation" means the navigation itself has to actually work, even
 * while what it leads to is honestly still being built.
 *
 * "My Planners" deliberately points at the existing `/app/planners`
 * (built and validated across the prior backend phases) rather than the
 * `/app/my-planners` path named illustratively in the brief - reusing the
 * real, already-correct route beats duplicating it under a second path
 * for the sake of matching an example literally.
 */

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface DashboardNavSection {
  label: string;
  items: DashboardNavItem[];
}

export const dashboardNav: DashboardNavSection[] = [
  {
    label: "Workspace",
    items: [
      { label: "My Planners", href: "/app/planners", icon: NotebookPen },
      { label: "Quick Stats", href: "/app/analytics", icon: BarChart3 },
      { label: "Activity", href: "/app/activity", icon: Activity },
    ],
  },
  {
    label: "Discover",
    items: [{ label: "Store", href: "/app/store", icon: Store }],
  },
  {
    label: "Support",
    items: [
      { label: "Resources", href: "/app/resources", icon: BookOpen },
      { label: "Help", href: "/app/help", icon: CircleHelp },
    ],
  },
  {
    label: "Account",
    items: [
      // Everplans Money Prompt 5's purchase-history experience - listed
      // under "Account" rather than nested inside Budget Planner's own nav
      // (`@/lib/planner-workspaces.ts`) because it's deliberately
      // product-agnostic: every Everplans purchase belongs here, not just
      // Budget Planner's, the same "reusable for future products"
      // requirement `orders`/`entitlements` were already built around.
      { label: "Purchases", href: "/app/purchases", icon: Receipt },
      { label: "Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

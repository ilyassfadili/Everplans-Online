import { Icon } from "@/components/ui";
import { dashboardNav } from "@/config/dashboard-nav";

import { DashboardNavLink } from "./dashboard-nav-link";

interface DashboardNavSectionsProps {
  onNavigate?: () => void;
}

/**
 * The Dashboard's four nav sections (Workspace / Discover / Support /
 * Account), rendered once and reused by both `DashboardSidebar` (desktop)
 * and `DashboardMobileNav`'s drawer - the same list, the same order, the
 * same active-state logic, in both places, rather than two components
 * quietly drifting apart over time.
 *
 * Still a Server Component - it's the one place `item.icon` (a
 * `LucideIcon` component reference from `@/config/dashboard-nav`) gets
 * turned into an actual `<Icon>` element before being handed to
 * `DashboardNavLink` (a Client Component). That ordering matters: passing
 * `item.icon` itself as a prop into a Client Component crashes ("Only
 * plain objects can be passed to Client Components from Server
 * Components... Classes or other objects with methods are not
 * supported") - passing the already-rendered element `DashboardNavLink`
 * received instead is exactly what `children`/element props are for.
 * `group-aria-[current=page]:text-brand` on the icon reacts to
 * `DashboardNavLink`'s own `aria-current` state at paint time, so the
 * color still switches correctly even though the element itself is
 * constructed once, here, before that state is knowable.
 *
 * `onNavigate` is only ever supplied by the mobile drawer (to close itself
 * after a link is clicked) - the desktop sidebar has nothing to close, so
 * it renders this with no `onNavigate` at all rather than passing a no-op.
 */
export function DashboardNavSections({ onNavigate }: DashboardNavSectionsProps) {
  return (
    <div className="flex flex-col gap-6">
      {dashboardNav.map((section) => (
        <div key={section.label}>
          <p className="px-3 text-label font-semibold uppercase tracking-[0.08em] text-ink-faint">
            {section.label}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <DashboardNavLink
                  href={item.href}
                  label={item.label}
                  icon={
                    <Icon
                      icon={item.icon}
                      size="sm"
                      className="text-ink-faint group-aria-[current=page]:text-brand"
                    />
                  }
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

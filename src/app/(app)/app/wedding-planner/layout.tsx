import type { ReactNode } from "react";

/**
 * The Wedding Planner section's own layout. A thin pass-through: the real
 * shell (sidebar/topbar/auth gate) is still `(app)/layout.tsx`, one level
 * up. `WeddingSearch` used to render a second search bar here, duplicating
 * the one already in the top bar (`DashboardSearch`) - removed so search is
 * discoverable in exactly one place.
 */
export default function WeddingPlannerLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}

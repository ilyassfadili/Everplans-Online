import type { ReactNode } from "react";

/**
 * The Home Planner section's own layout. A thin pass-through: the real
 * shell (sidebar/topbar/auth gate) is still `(app)/layout.tsx`, one level
 * up - the same "no separate application shell" rule `wedding-planner/layout.tsx`,
 * `budget-planner/layout.tsx`, and `travel-planner/layout.tsx` already follow.
 */
export default function HomePlannerLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}

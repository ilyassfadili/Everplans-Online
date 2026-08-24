import type { ReactNode } from "react";

/**
 * The Life Planner section's own layout. A thin pass-through: the real
 * shell (sidebar/topbar/auth gate) is still `(app)/layout.tsx`, one level
 * up - the same "no separate application shell" rule `travel-planner/layout.tsx`
 * and `home-planner/layout.tsx` already follow.
 */
export default function LifePlannerLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}

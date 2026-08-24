import type { ReactNode } from "react";

/**
 * The Travel Planner section's own layout. A thin pass-through: the real
 * shell (sidebar/topbar/auth gate) is still `(app)/layout.tsx`, one level
 * up - the same "no separate application shell" rule `wedding-planner/layout.tsx`
 * and `budget-planner/layout.tsx` already follow (Prompt 1 Phase 2: "do not
 * create a separate application shell").
 */
export default function TravelPlannerLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}

import type { ReactNode } from "react";

/**
 * The Budget Planner section's own layout. A thin pass-through, same as
 * `wedding-planner/layout.tsx`: the real shell (sidebar/topbar/auth gate)
 * is still `(app)/layout.tsx`, one level up.
 */
export default function BudgetPlannerLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}

import type { DashboardPlanner } from "@/types/dashboard-planner";

import { PlannerCard } from "./planner-card";

interface PlannerGridProps {
  planners: DashboardPlanner[];
}

/**
 * The responsive layout for however many active planners exist - one,
 * two, or several, per Phase 1 §7. Single column until there's room for
 * a second (`sm`, 640px), a third only once there's room for that too
 * (`xl`, 1280px) - not `lg` (1024px), even though the public site's own
 * card grids use `lg` for their third column. The difference is
 * deliberate: those grids render full-bleed, with the entire viewport
 * available; every grid inside `(app)` renders beside `DashboardSidebar`,
 * which becomes visible starting at that exact same `lg` breakpoint
 * (Dashboard V2 Prompt 5's cross-device audit caught this). At a
 * viewport right at 1024px - explicitly one of the required audited
 * widths - `lg:grid-cols-3` and the sidebar's own `lg:flex` would both
 * fire together, squeezing three `padding="lg"` cards into roughly
 * 208px each once the sidebar's 256px is subtracted, well below what
 * their own internal padding can comfortably hold. Pushed to `xl`
 * (1280px), the sidebar has already been accounted for well before the
 * third column appears - the math works out to roughly 293px per card at
 * that boundary, and a comfortable ~324px in two-column layouts all the
 * way down to 1024px. Every other planner/product/resource grid inside
 * `(app)` (`/app/planners`, `/app/store`, `/app/resources`) carries the
 * same fix, for the same reason.
 */
export function PlannerGrid({ planners }: PlannerGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {planners.map((planner) => (
        <PlannerCard key={planner.id} planner={planner} />
      ))}
    </div>
  );
}

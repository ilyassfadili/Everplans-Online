import { Link } from "@/components/ui";
import { cn } from "@/lib/cn";

interface PlanningViewSwitchProps {
  active: "weekly" | "monthly";
  className?: string;
}

/**
 * The small segmented control connecting the Weekly and Monthly Planning
 * views (Phase 1 §6) - a plain server component, not a client one: which
 * tab is "active" is already known by whichever page renders this (the
 * weekly page always passes `"weekly"`, the monthly page always passes
 * `"monthly"`), so there's no need for `usePathname()` the way `NavLink`
 * needs it for the site's own primary nav, whose active state can't be
 * known ahead of render.
 */
export function PlanningViewSwitch({ active, className }: PlanningViewSwitchProps) {
  return (
    <div className={cn("inline-flex w-fit items-center gap-1 rounded-lg border border-line-subtle bg-surface-muted p-1", className)}>
      <Link
        href="/app/life-planner/planning/weekly"
        variant="nav"
        aria-current={active === "weekly" ? "page" : undefined}
        className="rounded-md px-3.5 py-1.5 text-body-sm font-medium no-underline aria-[current=page]:bg-surface aria-[current=page]:shadow-sm"
      >
        Weekly
      </Link>
      <Link
        href="/app/life-planner/planning/monthly"
        variant="nav"
        aria-current={active === "monthly" ? "page" : undefined}
        className="rounded-md px-3.5 py-1.5 text-body-sm font-medium no-underline aria-[current=page]:bg-surface aria-[current=page]:shadow-sm"
      >
        Monthly
      </Link>
    </div>
  );
}

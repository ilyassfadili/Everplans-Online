import { Button } from "@/components/ui";

export type GoalStatusFilter = "all" | "active" | "completed";

const TABS: { value: GoalStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

interface GoalStatusTabsProps {
  active: GoalStatusFilter;
}

/**
 * A light "All / Active / Completed" segmented filter (Phase 2 §4: "at a
 * light level if it's cheap") - plain `Button` links carrying the filter as
 * a real `?status=` query param, the same "segmented set of full-navigation
 * links, no client JS" shape `TransactionsFilterBar`'s own `TYPE_TABS` uses,
 * so the current view stays a shareable/bookmarkable URL. `active` never
 * needs its own tab - `paused` and `not_started` goals both count as
 * "active" (still being pursued or not yet abandoned), leaving only
 * `completed` as its own distinct bucket worth filtering to.
 */
export function GoalStatusTabs({ active }: GoalStatusTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter goals by status">
      {TABS.map((tab) => (
        <Button
          key={tab.value}
          href={tab.value === "all" ? "/app/life-planner/goals" : `/app/life-planner/goals?status=${tab.value}`}
          variant={active === tab.value ? "primary" : "outline"}
          size="sm"
          aria-current={active === tab.value ? "page" : undefined}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}

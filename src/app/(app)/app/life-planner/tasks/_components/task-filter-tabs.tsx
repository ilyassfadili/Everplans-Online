import { Button } from "@/components/ui";

export type TaskFilter = "all" | "today-overdue" | "upcoming" | "completed";

const TABS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today-overdue", label: "Today & Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

interface TaskFilterTabsProps {
  active: TaskFilter;
}

/**
 * The tasks list's "All / Today & Overdue / Upcoming / Completed" segmented
 * filter (Phase 1 §4) - plain `Button` links carrying the filter as a real
 * `?filter=` query param, the same "segmented set of full-navigation links,
 * no client JS" shape `GoalStatusTabs`
 * (`@/app/(app)/app/life-planner/goals/_components/goal-status-tabs`)
 * already establishes, so the current view stays a shareable/bookmarkable URL.
 */
export function TaskFilterTabs({ active }: TaskFilterTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter tasks">
      {TABS.map((tab) => (
        <Button
          key={tab.value}
          href={tab.value === "all" ? "/app/life-planner/tasks" : `/app/life-planner/tasks?filter=${tab.value}`}
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

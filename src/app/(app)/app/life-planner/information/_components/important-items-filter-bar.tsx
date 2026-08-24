import { Button, Link } from "@/components/ui";
import { LIFE_IMPORTANT_ITEM_CATEGORIES, type LifeImportantItemCategory } from "@/types/life-planner";

import { IMPORTANT_ITEM_CATEGORY_LABEL } from "./important-item-visuals";

export type ImportantItemCategoryFilter = LifeImportantItemCategory | "all";

const INFORMATION_PATH = "/app/life-planner/information";

interface ImportantItemsFilterBarProps {
  active: ImportantItemCategoryFilter;
  includeArchived: boolean;
}

function buildHref(category: ImportantItemCategoryFilter, includeArchived: boolean): string {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (includeArchived) params.set("archived", "1");
  const qs = params.toString();
  return qs ? `${INFORMATION_PATH}?${qs}` : INFORMATION_PATH;
}

/**
 * The Important Items list's own filter bar (Life Planner Prompt 4 Phase 3
 * §4) - a light "All / Plan / Intention / Milestone / Reference / Note /
 * Other" segmented category filter plus an archive-view toggle, both plain
 * full-navigation links carrying the filter as real `?category=`/`?archived=`
 * query params, the same "no client JS, shareable/bookmarkable URL" shape
 * `GoalStatusTabs` (`../../goals/_components/goal-status-tabs`) establishes
 * for Goals' own `?status=` filter and `JournalFilterBar`'s own archive
 * toggle reuses one module over.
 */
export function ImportantItemsFilterBar({ active, includeArchived }: ImportantItemsFilterBarProps) {
  const tabs: { value: ImportantItemCategoryFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...LIFE_IMPORTANT_ITEM_CATEGORIES.map((category) => ({ value: category, label: IMPORTANT_ITEM_CATEGORY_LABEL[category] })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            href={buildHref(tab.value, includeArchived)}
            variant={active === tab.value ? "primary" : "outline"}
            size="sm"
            aria-current={active === tab.value ? "page" : undefined}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Link href={buildHref(active, !includeArchived)} variant="subtle" className="self-start text-body-sm">
        {includeArchived ? "← Back to active items" : "View archived items"}
      </Link>
    </div>
  );
}

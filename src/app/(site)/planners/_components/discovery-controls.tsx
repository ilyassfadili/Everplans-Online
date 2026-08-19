import { Search, Tag } from "lucide-react";

import { Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Select } from "@/components/ui/form/select";

/**
 * Search and category filtering, shown genuinely disabled rather than
 * omitted or faked. There is nothing to search or filter yet, and a
 * control that looks interactive but does nothing is worse than no
 * control at all - so this establishes where discovery will live once
 * there's a catalog to search, without pretending it works today.
 *
 * Deliberately only two controls (search, category) rather than the full
 * search/category/sort/filter set - a disabled sort or filter row has
 * nothing meaningful to sort or filter yet, and would just be UI clutter
 * standing in for logic that doesn't exist.
 *
 * Rendered as `PlannerCollection`'s `beforeContent` - part of the same
 * empty-state panel rather than its own section - so the disabled bar
 * and the "library is empty" message read as one intentional experience
 * instead of two consecutive "nothing here" moments.
 */
export function DiscoveryControls() {
  return (
    <div>
      <div className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-disabled"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <Input
            disabled
            placeholder="Search planners"
            aria-label="Search planners"
            className="h-12 rounded-lg border-line-subtle bg-surface-muted/40 pl-11 disabled:bg-surface-muted/40"
          />
        </div>
        <div className="hidden h-8 w-px bg-line-subtle sm:block" aria-hidden="true" />
        <div className="relative sm:w-56">
          <Tag
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-disabled"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <Select
            disabled
            aria-label="Filter by category"
            defaultValue="all"
            options={[{ value: "all", label: "All categories" }]}
            className="h-12 rounded-lg border-line-subtle bg-surface-muted/40 pl-11 disabled:bg-surface-muted/40"
          />
        </div>
      </div>
      <Text size="caption" tone="faint" className="mt-2.5">
        Search and category filtering will switch on once the first planners are added.
      </Text>
    </div>
  );
}

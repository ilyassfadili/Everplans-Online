import { Button, FormField, Link, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { LifeArea } from "@/types/life-planner";

const JOURNAL_PATH = "/app/life-planner/journal";

/** Sentinel for "all areas" - Radix's `Select.Item` can't take a genuinely empty `value`, the same constraint `GoalAreaSelect`'s own `NO_AREA_VALUE` and `TransactionsFilterBar`'s own `ALL_VALUE` work around. */
const ALL_AREAS_VALUE = "all";

interface JournalFilterBarProps {
  query: string;
  lifeAreaId?: string;
  includeArchived: boolean;
  areas: LifeArea[];
}

/** The archived-view toggle's own href - preserves whatever search/area filter is already active, the same "carry every other param forward" shape `typeTabHref` (`TransactionsFilterBar`) uses. */
function archiveToggleHref(query: string, lifeAreaId: string | undefined, nextIncludeArchived: boolean): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (lifeAreaId) params.set("area", lifeAreaId);
  if (nextIncludeArchived) params.set("archived", "1");
  const qs = params.toString();
  return qs ? `${JOURNAL_PATH}?${qs}` : JOURNAL_PATH;
}

/**
 * The Journal list's own filter bar (Life Planner Prompt 4 Phase 2) - a
 * lightweight `ilike` search plus an optional Life Area filter, both driven
 * by `?q=`/`?area=` search params via one plain `<form method="GET">`, the
 * same "no client JS needed, the page itself is already driven by
 * `searchParams`" shape `TransactionsFilterBar` already establishes.
 * Deliberately not a client component - `Select`/`Input`/`Button` are all
 * client components in their own right, but this composing file needs no
 * interactivity of its own.
 */
export function JournalFilterBar({ query, lifeAreaId, includeArchived, areas }: JournalFilterBarProps) {
  const areaOptions = [{ value: ALL_AREAS_VALUE, label: "All Life Areas" }, ...areas.map((area) => ({ value: area.id, label: area.name }))];

  return (
    <div className="flex flex-col gap-3">
      <form method="GET" action={JOURNAL_PATH} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface p-4 sm:flex-row sm:items-end">
        {includeArchived && <input type="hidden" name="archived" value="1" />}
        <FormField label="Search" className="flex-1">
          <Input name="q" defaultValue={query} placeholder="Search your entries" />
        </FormField>
        <FormField label="Life Area" className="sm:w-56">
          <Select name="area" defaultValue={lifeAreaId ?? ALL_AREAS_VALUE} options={areaOptions} />
        </FormField>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <Link href={archiveToggleHref(query, lifeAreaId, !includeArchived)} variant="subtle" className="self-start text-body-sm">
        {includeArchived ? "← Back to active entries" : "View archived entries"}
      </Link>
    </div>
  );
}

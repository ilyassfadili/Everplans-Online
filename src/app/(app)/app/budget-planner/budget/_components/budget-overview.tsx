import { Button, Card, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetCategoryGroup, BudgetCategorySummary, BudgetSummary } from "@/types/budget";

interface BudgetOverviewProps {
  summary: BudgetSummary;
  categorySummaries: BudgetCategorySummary[];
  currency: string;
}

const GROUP_LABEL: Record<BudgetCategoryGroup, string> = {
  essentials: "Essentials",
  lifestyle: "Lifestyle",
  savings: "Savings",
  goals: "Goals",
  other: "Other",
};

const GROUP_ORDER: BudgetCategoryGroup[] = ["essentials", "lifestyle", "savings", "goals", "other"];

/**
 * The Budget page's own top-of-page numbers - expected income, planned,
 * and what's left to allocate, plus one calm progress bar. Same "no charts
 * simply for decoration" rule `wedding-planner/budget`'s own `BudgetOverview`
 * follows - a plain bar communicates "how much of my income is planned"
 * without needing a real chart library.
 *
 * No heading of its own - `PageHeader` right above already says "Budget"
 * once; a second "Budget" title on this card read as a mistake, not
 * hierarchy. Gated on income alone, not "income and planned both zero":
 * once income exists, `0% allocated / $X unallocated` is already a
 * meaningful, encouraging number even with zero categories - it's *only*
 * the no-income case where every percentage here would be a divide-by-zero
 * fiction, and that's the one case worth a dedicated getting-started card.
 */
export function BudgetOverview({ summary, categorySummaries, currency }: BudgetOverviewProps) {
  if (summary.expectedIncomeCents === 0) {
    const hasCategories = categorySummaries.length > 0;
    return (
      <Card variant="standard" padding="lg">
        <Text weight="medium" className="text-ink">
          {hasCategories ? "Add your income to see what's available" : "Let's get your budget started"}
        </Text>
        <Text tone="muted" className="mt-1">
          {hasCategories
            ? "You've started your categories - add your income next to see how much you actually have to work with."
            : "Add your income, then set a planned amount for each category to build out your budget."}
        </Text>
        <Button href="/app/budget-planner/income" size="sm" className="mt-4">
          Add income
        </Button>
      </Card>
    );
  }

  const percentAllocated = summary.expectedIncomeCents > 0 ? Math.round((summary.totalPlannedCents / summary.expectedIncomeCents) * 100) : 0;
  const isOverAllocated = summary.unallocatedCents < 0;

  // Same "only once it says something" rule `CategoryList` applies to its
  // own group headers - a single-group breakdown would just be one bar at
  // 100%, not a useful allocation-by-priority read.
  const groupBreakdown = GROUP_ORDER.map((group) => ({
    group,
    plannedCents: categorySummaries.filter((s) => s.category.group === group).reduce((sum, s) => sum + s.category.plannedAmountCents, 0),
  })).filter((entry) => entry.plannedCents > 0);

  return (
    <Card variant="standard" padding="lg">
      <div className="grid gap-4 sm:grid-cols-3">
        <Figure label="Expected income" value={formatCurrency(summary.expectedIncomeCents, currency)} />
        <Figure label="Planned" value={formatCurrency(summary.totalPlannedCents, currency)} />
        <Figure
          label={isOverAllocated ? "Over by" : "Unallocated"}
          value={formatCurrency(Math.abs(summary.unallocatedCents), currency)}
        />
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${isOverAllocated ? "bg-warning" : "bg-brand"}`}
          style={{ width: `${Math.min(100, percentAllocated)}%` }}
        />
      </div>
      <Text size="body-sm" tone="muted" className="mt-2">
        {isOverAllocated ? "Your planned categories add up to more than your expected income." : `${percentAllocated}% of your expected income is allocated`}
      </Text>

      {groupBreakdown.length > 1 && (
        <div className="mt-5 border-t border-line-subtle pt-4">
          <Text size="body-sm" weight="medium" tone="muted" className="uppercase tracking-wide">
            Where it&rsquo;s allocated
          </Text>
          <div className="mt-3 flex flex-col gap-2">
            {groupBreakdown.map(({ group, plannedCents }) => {
              const share = Math.round((plannedCents / summary.totalPlannedCents) * 100);

              return (
                <div key={group} className="flex items-center gap-3">
                  <Text size="body-sm" className="w-24 shrink-0 text-ink">
                    {GROUP_LABEL[group]}
                  </Text>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${share}%` }} />
                  </div>
                  <Text size="body-sm" tone="muted" className="w-12 shrink-0 text-right">
                    {share}%
                  </Text>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="body-sm" tone="muted">
        {label}
      </Text>
      <Text size="body-lg" weight="semibold" className="text-ink">
        {value}
      </Text>
    </div>
  );
}

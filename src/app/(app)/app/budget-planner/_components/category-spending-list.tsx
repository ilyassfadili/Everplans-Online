import { Card, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { MonthlyCategoryBreakdown } from "@/types/budget";

interface CategorySpendingListProps {
  categoryBreakdown: MonthlyCategoryBreakdown[];
  currency: string;
}

/**
 * The Money Overview's spending-by-category read for the selected month
 * (Everplans Money Prompt 1 Phase 3 / Prompt 3) - a plain horizontal bar per
 * category, width relative to the largest category's spend. `categoryBreakdown`
 * arrives already sorted highest-first (`getMonthlyOverview`), so this only
 * renders it - no chart library, no re-sorting, no synthetic data. Renders
 * nothing at all when there's no spend to show, rather than an empty bar
 * shell with nothing in it.
 */
export function CategorySpendingList({ categoryBreakdown, currency }: CategorySpendingListProps) {
  if (categoryBreakdown.length === 0) {
    return null;
  }

  const maxAmountCents = categoryBreakdown[0].actualCents;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col gap-4">
      <Heading as="h3" size="h4">
        Spending by category
      </Heading>
      <ul className="flex flex-col gap-3">
        {categoryBreakdown.map(({ category, actualCents }) => {
          const widthPercent = maxAmountCents > 0 ? Math.max(4, Math.round((actualCents / maxAmountCents) * 100)) : 0;
          return (
            <li key={category.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <Text size="body-sm" weight="medium" className="truncate text-ink">
                  {category.name}
                </Text>
                <Text size="body-sm" weight="medium" className="shrink-0 text-ink">
                  {formatCurrency(actualCents, currency)}
                </Text>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-brand" style={{ width: `${widthPercent}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

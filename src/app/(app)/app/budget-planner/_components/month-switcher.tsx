import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button, Icon, Text } from "@/components/ui";
import { formatMonthLabel, getCurrentMonthKey, isCurrentMonth, shiftMonth, type MonthKey } from "@/lib/budget/month";

interface MonthSwitcherProps {
  month: MonthKey;
  /** The page this switcher lives on, e.g. `/app/budget-planner` - every link it renders points back here with an updated `?month=`. */
  basePath: string;
  /** Any other active search params (Transactions' own type/category/account/search filters) - preserved across every month link so switching months never resets an unrelated filter. */
  extraParams?: Record<string, string>;
}

function monthHref(basePath: string, month: MonthKey, extraParams?: Record<string, string>): string {
  const params = new URLSearchParams(extraParams);
  params.set("month", month);
  return `${basePath}?${params.toString()}`;
}

/**
 * The Money Overview's month-navigation control (Everplans Money Prompt 1's
 * "current month, previous month, next month, month selection" foundation),
 * shared verbatim across every page whose data is month-scoped (Overview,
 * Income, Expenses, Transactions - Prompt 2 Phase 4's "monthly context must
 * work consistently across" requirement). Plain `<Link>`-backed navigation
 * (via `Button`'s `href` render path), not client-side state - each page
 * itself reads `?month=` server-side (`parseMonthParam`, `@/lib/budget/month`)
 * and re-fetches for that month, so there's never a mismatch between what
 * this control shows and what the page below it displays.
 */
export function MonthSwitcher({ month, basePath, extraParams }: MonthSwitcherProps) {
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const currentlyOnToday = isCurrentMonth(month);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Select month">
      <Button href={monthHref(basePath, previousMonth, extraParams)} variant="outline" size="sm" aria-label="Previous month">
        <Icon icon={ChevronLeft} size="sm" />
      </Button>
      <Text size="body" weight="medium" className="min-w-[10ch] text-center" aria-live="polite">
        {formatMonthLabel(month)}
      </Text>
      <Button href={monthHref(basePath, nextMonth, extraParams)} variant="outline" size="sm" aria-label="Next month">
        <Icon icon={ChevronRight} size="sm" />
      </Button>
      {!currentlyOnToday && (
        <Button href={monthHref(basePath, getCurrentMonthKey(), extraParams)} variant="ghost" size="sm">
          This month
        </Button>
      )}
    </div>
  );
}

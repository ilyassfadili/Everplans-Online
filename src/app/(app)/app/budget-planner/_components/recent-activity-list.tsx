import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, Heading, Icon, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { cn } from "@/lib/cn";
import type { BudgetTransaction } from "@/types/budget";

interface RecentActivityListProps {
  transactions: BudgetTransaction[];
  currency: string;
}

function formatTransactionDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * The Money Overview's recent-activity read for the selected month
 * (Everplans Money Prompt 1 Phase 3 / Prompt 3) - the 8 most recent
 * transactions, newest first (`getMonthlyOverview`'s own
 * `RECENT_ACTIVITY_LIMIT`), combining both income and expenses. Category
 * isn't resolvable here without a second lookup and is deliberately
 * omitted - the full Transactions page (built separately) is where category
 * detail lives. Income vs. expense is never color alone: each row pairs its
 * tint with a distinct arrow icon, the explicit word "Income"/"Expense", and
 * a signed amount ("+"/"-").
 */
export function RecentActivityList({ transactions, currency }: RecentActivityListProps) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col gap-4">
      <Heading as="h3" size="h4">
        Recent activity
      </Heading>
      <ul className="flex flex-col divide-y divide-line-subtle">
        {transactions.map((transaction) => {
          const isIncome = transaction.type === "income";
          return (
            <li key={transaction.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    isIncome ? "bg-success-subtle text-success" : "bg-error-subtle text-error",
                  )}
                >
                  <Icon icon={isIncome ? ArrowDownRight : ArrowUpRight} size="sm" />
                </div>
                <div className="min-w-0">
                  <Text size="body-sm" weight="medium" className="truncate text-ink">
                    {transaction.title}
                  </Text>
                  <Text size="caption" tone="faint">
                    {isIncome ? "Income" : "Expense"} · {formatTransactionDate(transaction.date)}
                  </Text>
                </div>
              </div>
              <Text size="body-sm" weight="semibold" tone={isIncome ? "success" : "error"} className="shrink-0">
                {isIncome ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amountCents), currency)}
              </Text>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

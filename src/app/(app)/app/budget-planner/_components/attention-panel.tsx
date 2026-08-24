import { AlertCircle } from "lucide-react";

import { Button, Card, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetCategorySummary, BudgetSummary } from "@/types/budget";

import { PanelHeader } from "./panel-header";

interface AttentionPanelProps {
  summary: BudgetSummary;
  categorySummaries: BudgetCategorySummary[];
  currency: string;
}

interface AttentionItem {
  key: string;
  message: string;
  href: string;
}

/**
 * The dashboard's "what needs a look" surface (Prompt 2 Phase 1's own
 * hierarchy: overall status, then money, then spending, then goals, then
 * attention last - the least urgent-feeling position for what could
 * otherwise read as a list of problems). Built entirely from numbers the
 * Budget/Income pages already show - never a second, independently
 * computed judgment - and rendered only when there's something genuinely
 * worth surfacing, never an empty "all good!" card competing for space.
 * Deliberately calm: plain sentences, not warning icons on every row.
 */
export function AttentionPanel({ summary, categorySummaries, currency }: AttentionPanelProps) {
  const items: AttentionItem[] = [];

  const overBudgetCategories = categorySummaries.filter((c) => c.isOverBudget);
  for (const c of overBudgetCategories.slice(0, 3)) {
    items.push({
      key: `over-${c.category.id}`,
      message: `${c.category.name} is over its planned amount by ${formatCurrency(c.actualCents - c.category.plannedAmountCents, currency)}.`,
      href: "/app/budget-planner/budget",
    });
  }

  if (summary.status === "over-allocated") {
    items.push({
      key: "over-allocated",
      message: `Your planned categories add up to ${formatCurrency(Math.abs(summary.unallocatedCents), currency)} more than your expected income.`,
      href: "/app/budget-planner/budget",
    });
  } else if (summary.status === "needs-attention") {
    items.push({
      key: "unallocated",
      message: `${formatCurrency(summary.unallocatedCents, currency)} of your expected income isn't assigned to a category yet.`,
      href: "/app/budget-planner/budget",
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card variant="standard" padding="lg">
      <PanelHeader icon={AlertCircle} tone="warning" title="Needs a look" />
      <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
        {items.slice(0, 4).map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 py-2.5">
            <Text size="body-sm" className="text-ink">
              {item.message}
            </Text>
            <Button href={item.href} variant="ghost" size="sm" className="shrink-0">
              Review
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

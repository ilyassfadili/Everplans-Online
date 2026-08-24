import { Wallet } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { getPeriodLabel } from "@/lib/budget/period";
import type { BudgetIncomeSummary, BudgetPeriodType } from "@/types/budget";

import { PanelHeader } from "./panel-header";

interface IncomePanelProps {
  summary: BudgetIncomeSummary;
  currency: string;
  periodType: BudgetPeriodType;
}

/** The dashboard's concise income glance - one total and a count, everything else lives on the full Income page. */
export function IncomePanel({ summary, currency, periodType }: IncomePanelProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Wallet}
        title="Income"
        action={
          <Button href="/app/budget-planner/income" variant="outline" size="sm">
            View income
          </Button>
        }
      />

      {summary.activeSourceCount === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Add what you expect to earn"
          description="Add each income source you have, on whatever schedule it follows - we'll translate it into what to expect."
          className="mt-4 py-10"
        />
      ) : (
        <div className="mt-4 flex flex-1 flex-col justify-center">
          <Text size="body-sm" tone="muted">
            Expected per {getPeriodLabel(periodType)}
          </Text>
          <Text weight="semibold" className="font-display text-h3 text-ink">
            {formatCurrency(summary.totalExpectedCents, currency)}
          </Text>
          <Text size="body-sm" tone="muted" className="mt-2">
            From {summary.activeSourceCount} active income {summary.activeSourceCount === 1 ? "source" : "sources"}
          </Text>
        </div>
      )}
    </Card>
  );
}

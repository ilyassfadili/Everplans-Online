import { Gauge } from "lucide-react";

import { Badge, Button, Card, EmptyState, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetStatus, BudgetSummary } from "@/types/budget";

import { PanelHeader } from "./panel-header";

interface StatusSummaryProps {
  summary: BudgetSummary;
  currency: string;
  hasAnyIncome: boolean;
  hasAnyCategories: boolean;
}

const STATUS_COPY: Record<BudgetStatus, { label: string; badgeVariant: "success" | "warning" | "error"; description: string }> = {
  healthy: {
    label: "On track",
    badgeVariant: "success",
    description: "Your planned spending fits comfortably within your expected income.",
  },
  "needs-attention": {
    label: "Needs a look",
    badgeVariant: "warning",
    description: "A meaningful amount of your income isn't allocated to a category yet.",
  },
  "over-allocated": {
    label: "Over-allocated",
    badgeVariant: "error",
    description: "Your planned spending adds up to more than you expect to bring in.",
  },
};

/**
 * The dashboard's answer to "how is my budget doing?" (Prompt 1 Phase 4's
 * own hierarchy: "overall status" comes first). Deliberately calm - a plain-
 * language label plus one sentence, never just a colored number, so status
 * is never communicated by color alone. Two honest partial states exist
 * before the full three-number picture is meaningful: no income yet, and
 * income with nothing planned yet.
 */
export function StatusSummary({ summary, currency, hasAnyIncome, hasAnyCategories }: StatusSummaryProps) {
  if (!hasAnyIncome) {
    return (
      <Card variant="standard" padding="lg" className="flex h-full flex-col">
        <PanelHeader icon={Gauge} title="Budget status" />
        <EmptyState
          icon={Gauge}
          title="Add your income to get started"
          description="Once we know what you expect to bring in, we can show you what's available to plan with."
          className="mt-4 py-10"
          action={
            <Button href="/app/budget-planner/income" size="sm">
              Add income
            </Button>
          }
        />
      </Card>
    );
  }

  const status = STATUS_COPY[summary.status];

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Gauge}
        tone={status.badgeVariant === "success" ? "success" : status.badgeVariant === "warning" ? "warning" : "brand"}
        title="Budget status"
        action={<Badge variant={status.badgeVariant}>{status.label}</Badge>}
      />

      <Text size="body-sm" tone="muted" className="mt-3">
        {status.description}
      </Text>

      <div className="mt-4 grid flex-1 grid-cols-3 gap-3">
        <StatusFigure label="Expected income" value={formatCurrency(summary.expectedIncomeCents, currency)} />
        <StatusFigure
          label={hasAnyCategories ? "Planned" : "Planned (none yet)"}
          value={formatCurrency(summary.totalPlannedCents, currency)}
        />
        <StatusFigure
          label={summary.unallocatedCents < 0 ? "Over by" : "Unallocated"}
          value={formatCurrency(Math.abs(summary.unallocatedCents), currency)}
          emphasize
        />
      </div>

      {!hasAnyCategories && (
        <div className="mt-4">
          <Button href="/app/budget-planner/budget" variant="outline" size="sm">
            Set up your categories
          </Button>
        </div>
      )}
    </Card>
  );
}

interface StatusFigureProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

function StatusFigure({ label, value, emphasize }: StatusFigureProps) {
  return (
    <div>
      <Text size="body-sm" tone="muted">
        {label}
      </Text>
      <Text size="body-lg" weight="semibold" className={emphasize ? "font-display text-h4 text-ink" : "text-ink"}>
        {value}
      </Text>
    </div>
  );
}

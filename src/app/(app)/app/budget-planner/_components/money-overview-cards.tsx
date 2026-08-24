import type { LucideIcon } from "lucide-react";
import { ArrowDownCircle, ArrowUpCircle, TrendingDown, TrendingUp } from "lucide-react";

import { Card, Icon, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { cn } from "@/lib/cn";
import type { MonthlyOverview } from "@/types/budget";

interface MoneyOverviewCardsProps {
  overview: MonthlyOverview;
  currency: string;
}

type CardTone = "success" | "brand" | "error";

const iconToneClass: Record<CardTone, string> = {
  success: "bg-success-subtle text-success",
  brand: "bg-accent-subtle text-brand",
  error: "bg-error-subtle text-error",
};

/**
 * The Money Overview's three at-a-glance figures for the selected month -
 * income, expenses, and net (Everplans Money Prompt 1 Phase 3 / Prompt 3's
 * Overview integration). Deliberately never color alone: income and
 * expenses each already carry an explicit label plus a distinct icon, and
 * net additionally swaps its icon between `TrendingUp`/`TrendingDown` (on
 * top of `formatCurrency`'s own signed "-" prefix) so a negative month
 * reads as unmistakable even to someone who can't distinguish the
 * success/error hues.
 */
export function MoneyOverviewCards({ overview, currency }: MoneyOverviewCardsProps) {
  const isPositiveNet = overview.netCents >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <OverviewCard
        icon={ArrowDownCircle}
        tone="success"
        label="Income"
        value={formatCurrency(overview.totalIncomeCents, currency)}
      />
      <OverviewCard
        icon={ArrowUpCircle}
        tone="brand"
        label="Expenses"
        value={formatCurrency(overview.totalExpenseCents, currency)}
      />
      <OverviewCard
        icon={isPositiveNet ? TrendingUp : TrendingDown}
        tone={isPositiveNet ? "success" : "error"}
        label="Net"
        value={formatCurrency(overview.netCents, currency)}
        valueTone={isPositiveNet ? "success" : "error"}
        caption={isPositiveNet ? "More came in than went out" : "Spending outpaced income this month"}
      />
    </div>
  );
}

interface OverviewCardProps {
  icon: LucideIcon;
  tone: CardTone;
  label: string;
  value: string;
  valueTone?: "success" | "error";
  caption?: string;
}

function OverviewCard({ icon, tone, label, value, valueTone, caption }: OverviewCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", iconToneClass[tone])}>
          <Icon icon={icon} size="sm" />
        </div>
        <Text size="body-sm" tone="muted">
          {label}
        </Text>
      </div>
      <Text weight="semibold" tone={valueTone ?? "default"} className="font-display text-h3">
        {value}
      </Text>
      {caption && (
        <Text size="caption" tone="faint">
          {caption}
        </Text>
      )}
    </Card>
  );
}

import { Sparkles } from "lucide-react";

import { Button, Card, Text } from "@/components/ui";
import type { BudgetInsight } from "@/lib/budget/insights";

import { PanelHeader } from "./panel-header";

interface InsightsPanelProps {
  insights: BudgetInsight[];
}

/** How many insights the dashboard shows at once - Prompt 4 Phase 3's own "do not show 20 insights at once, only the highest-value ones." */
const MAX_DASHBOARD_INSIGHTS = 3;

/**
 * The dashboard's "is there something useful I should know?" surface
 * (Prompt 4 Phase 3). Renders nothing at all when there's nothing to say -
 * an empty "no insights yet" card would be exactly the clutter this
 * feature is meant to avoid, the same choice `AttentionPanel` makes.
 */
export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return null;
  }

  const featured = insights.slice(0, MAX_DASHBOARD_INSIGHTS);

  return (
    <Card variant="standard" padding="lg">
      <PanelHeader icon={Sparkles} title="Insights" />
      <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
        {featured.map((insight) => (
          <li key={insight.id} className="flex items-center justify-between gap-3 py-2.5">
            <Text size="body-sm" className="text-ink">
              {insight.message}
            </Text>
            <Button href={insight.actionHref} variant="ghost" size="sm" className="shrink-0">
              {insight.actionLabel}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

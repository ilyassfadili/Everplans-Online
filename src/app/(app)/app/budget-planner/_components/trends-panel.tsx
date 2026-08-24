import { LineChart } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";

/**
 * Financial Overview & Trends (Prompt 4 Phase 4) - honestly empty today.
 * Trend comparisons ("is my spending increasing?", "am I saving more than
 * last period?") require historical period-over-period data this plan
 * doesn't record yet - only its current, live state. Rather than
 * manufacture a chart from a single data point, this explains plainly what
 * unlocks the feature, per the phase's own "do not show misleading charts
 * ... instead explain" instruction. Low-priority placement (bottom of the
 * dashboard) and no separate nav item - this isn't an analytics product,
 * just an honest placeholder for a real capability once history exists.
 */
export function TrendsPanel() {
  return (
    <Card variant="standard" padding="lg">
      <EmptyState
        icon={LineChart}
        titleAs="h2"
        title="Trends will appear as you build more history"
        description="Once you've used your budget across a few periods, you'll see how your income, spending, and savings are changing over time."
        className="py-8"
      />
    </Card>
  );
}

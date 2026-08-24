import { Luggage } from "lucide-react";

import { Button, Card, EmptyState, ProgressRing, Text } from "@/components/ui";
import type { PackingProgress } from "@/types/travel";

import { PanelHeader } from "./panel-header";

interface PackingSummaryCardProps {
  progress: PackingProgress;
}

/** The dashboard's packing summary (Prompt 4 Phase 4 §2) - the same `calculatePackingProgress` the Packing page itself uses. */
export function PackingSummaryCard({ progress }: PackingSummaryCardProps) {
  if (progress.totalCount === 0) {
    return (
      <Card variant="standard" padding="lg" className="flex h-full flex-col">
        <PanelHeader icon={Luggage} title="Packing" />
        <EmptyState
          className="mt-4 border-none bg-transparent px-0 py-6"
          title="No packing list yet"
          description="Start your checklist so you know what's left before you go."
          action={
            <Button href="/app/travel-planner/packing" variant="secondary" size="sm">
              Start packing list
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={Luggage} title="Packing" />
      <div className="mt-4 flex flex-1 items-center gap-6">
        <div className="relative shrink-0">
          <ProgressRing percent={progress.percent} size={72} strokeWidth={7} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-body-lg leading-none text-ink">{progress.percent}%</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Text size="body-sm" tone="muted">
            {progress.completedCount} of {progress.totalCount} packed
          </Text>
          <Button href="/app/travel-planner/packing" variant="ghost" size="sm" className="self-start">
            View packing list
          </Button>
        </div>
      </div>
    </Card>
  );
}

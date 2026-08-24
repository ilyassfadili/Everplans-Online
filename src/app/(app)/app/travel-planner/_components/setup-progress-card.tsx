import { Check, ClipboardList } from "lucide-react";

import { Card, ProgressRing, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { TripSetupProgress } from "@/types/travel";

import { PanelHeader } from "./panel-header";

interface SetupProgressCardProps {
  progress: TripSetupProgress;
  hasGoals: boolean;
  hasNotes: boolean;
}

function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          done ? "bg-brand text-ink-on-brand" : "bg-surface-muted ring-1 ring-inset ring-line",
        )}
        aria-hidden="true"
      >
        {done && <Check className="size-3" strokeWidth={2.5} />}
      </span>
      <Text size="body-sm" tone={done ? "muted" : "faint"} className={done ? "line-through decoration-line" : undefined}>
        {label}
      </Text>
    </div>
  );
}

/**
 * "How set up is this trip" - Prompt 1 Phase 4 §4: a simple planning
 * progress representation based only on currently implemented setup
 * information, never fabricated for features (itinerary/budget/bookings/...)
 * that don't exist yet. Destination, dates, travelers, and trip type are
 * always complete the moment a trip exists (they're required at creation),
 * so this reads as "mostly there" from day one and fills the rest in as
 * goals/notes get added - an honest reflection of `calculateTripSetupProgress`
 * (`@/lib/travel/progress.ts`), not a milestone tracker for work that hasn't
 * been built.
 */
export function SetupProgressCard({ progress, hasGoals, hasNotes }: SetupProgressCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={ClipboardList} title="Trip Setup" />
      <div className="mt-4 flex flex-1 items-center gap-6">
        <div className="relative shrink-0">
          <ProgressRing percent={progress.percent} size={88} strokeWidth={9} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-h4 leading-none text-ink">{progress.percent}%</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <ChecklistRow done label="Destination set" />
          <ChecklistRow done label="Dates set" />
          <ChecklistRow done label="Travelers set" />
          <ChecklistRow done={hasGoals} label="Trip goals added" />
          <ChecklistRow done={hasNotes} label="Notes added" />
        </div>
      </div>
    </Card>
  );
}

import { Check, ClipboardList } from "lucide-react";

import { Card, ProgressRing, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { HomeSetupProgress } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface SetupProgressCardProps {
  progress: HomeSetupProgress;
  hasAddress: boolean;
  hasHousehold: boolean;
  hasContacts: boolean;
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
 * "How organized is this home" - Phase 3's "progress/organization
 * indicators where meaningful": a simple planning progress representation
 * based only on currently implemented setup information, never fabricated
 * for features (rooms/inventory/maintenance/...) that don't exist yet. Name,
 * type, and ownership are always complete the moment a home exists (they're
 * required at creation), so this reads as "mostly there" from day one and
 * fills the rest in as address/household/contacts get added - an honest
 * reflection of `calculateHomeSetupProgress` (`@/lib/home-planner/progress`),
 * the same shape `SetupProgressCard` (Travel Planner) already establishes.
 */
export function SetupProgressCard({ progress, hasAddress, hasHousehold, hasContacts }: SetupProgressCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={ClipboardList} title="Home Setup" />
      <div className="mt-4 flex flex-1 items-center gap-6">
        <div className="relative shrink-0">
          <ProgressRing percent={progress.percent} size={88} strokeWidth={9} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-h4 leading-none text-ink">{progress.percent}%</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <ChecklistRow done label="Home profile created" />
          <ChecklistRow done label="Home type & ownership set" />
          <ChecklistRow done={hasAddress} label="Address added" />
          <ChecklistRow done={hasHousehold} label="Household added" />
          <ChecklistRow done={hasContacts} label="Important contact added" />
        </div>
      </div>
    </Card>
  );
}

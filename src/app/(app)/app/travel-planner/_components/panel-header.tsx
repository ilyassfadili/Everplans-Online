import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Heading, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

type PanelTone = "brand" | "warning" | "success";

// Every tone here is already a real Everplans token (`AGENTS.md`'s locked
// three-color system + its semantic status hues) - the same tone table
// `wedding-planner/_components/panel-header.tsx` already establishes.
const toneClass: Record<PanelTone, string> = {
  brand: "bg-accent-subtle text-brand",
  warning: "bg-warning-subtle text-warning",
  success: "bg-success-subtle text-success",
};

interface PanelHeaderProps {
  icon: LucideIcon;
  tone?: PanelTone;
  title: string;
  action?: ReactNode;
}

/**
 * The Travel Planner dashboard's shared panel heading - a colored icon chip
 * beside the title, so its cards read as distinct, scannable sections
 * instead of one undifferentiated stack of white cards. Colocated here (not
 * `@/components/ui`) since only this dashboard's panels use it - the same
 * "one per hand-built product's dashboard" convention Wedding Planner's own
 * copy already establishes.
 */
export function PanelHeader({ icon, tone = "brand", title, action }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", toneClass[tone])}>
          <Icon icon={icon} size="sm" />
        </div>
        <Heading as="h2" size="h4">
          {title}
        </Heading>
      </div>
      {action}
    </div>
  );
}

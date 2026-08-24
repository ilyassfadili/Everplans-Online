import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Heading, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

type PanelTone = "brand" | "warning" | "success";

// Same locked three-tone system `wedding-planner/_components/panel-header.tsx`
// already uses - never a new hue invented for this dashboard.
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
 * The Budget Planner dashboard's shared panel heading - a colored icon chip
 * beside the title, same pattern as the Wedding Planner dashboard's own
 * `PanelHeader`. Colocated here rather than shared cross-product, matching
 * this codebase's existing convention of one small panel-header component
 * per dashboard rather than a single generic one both products import.
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

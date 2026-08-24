import { ArrowRight, CheckCircle2, NotebookPen } from "lucide-react";

import { Badge, Card, Icon, Link, Text } from "@/components/ui";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { DashboardPlanner } from "@/types/dashboard-planner";

import { PlannerProgress } from "./planner-progress";

interface PlannerCardProps {
  planner: DashboardPlanner;
}

/**
 * One active planner, at a glance - the deliberate hierarchy Phase 1 §6
 * asks for, top to bottom: identity → progress → next action → last
 * active → Continue Planning. Every piece of optional data
 * (`description`, `nextAction`, `lastActiveAt`) renders conditionally
 * rather than as an empty label or a placeholder dash - a planner with
 * nothing to say for one of these fields just has one fewer line, never
 * a broken-looking gap.
 *
 * `status === "completed"` swaps the CTA from "Continue Planning" to
 * "Review Planner" and swaps the trailing icon from an arrow to a
 * checkmark (Phase 2 §4) - restrained, not celebratory: no confetti, no
 * color change beyond what the icon itself already communicates.
 *
 * Real, working navigation: the CTA links to `/app/planners/${slug}`,
 * the same detail route `resolvePlannerAccess` already gates (Backend
 * Prompt 3/6) - this card never invents a runtime or a route that
 * doesn't exist. It's currently unreachable with real data (see
 * `getActivePlanners`'s own comment), the same "real architecture,
 * empty today" status every populated-branch component in this codebase
 * already carries.
 */
export function PlannerCard({ planner }: PlannerCardProps) {
  const lastActiveLabel = formatRelativeTime(planner.lastActiveAt);
  const isCompleted = planner.status === "completed";

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
          <Icon icon={NotebookPen} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant="brand" className="mb-1.5">
            {planner.categoryName}
          </Badge>
          <Text as="p" weight="semibold" size="body-lg" className="truncate">
            {planner.name}
          </Text>
          {planner.description && (
            <Text size="body-sm" tone="muted" className="mt-0.5 line-clamp-2">
              {planner.description}
            </Text>
          )}
        </div>
      </div>

      <PlannerProgress
        percentage={planner.progressPercentage}
        completedSections={planner.completedSections}
        totalSections={planner.totalSections}
      />

      <div className="flex flex-col gap-1">
        {planner.nextAction && (
          <Text size="body-sm" className="text-ink">
            <span className="font-medium text-ink-muted">Next: </span>
            {planner.nextAction}
          </Text>
        )}
        {lastActiveLabel && (
          <Text size="caption" tone="faint">
            Last active {lastActiveLabel}
          </Text>
        )}
      </div>

      <Link
        href={`/app/planners/${planner.slug}`}
        variant="prominent"
        className="mt-auto flex items-center gap-1.5"
      >
        {isCompleted ? "Review Planner" : "Continue Planning"}
        <Icon icon={isCompleted ? CheckCircle2 : ArrowRight} size="sm" />
      </Link>
    </Card>
  );
}

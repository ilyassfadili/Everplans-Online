import { ArrowRight } from "lucide-react";

import { Button, Card, Text } from "@/components/ui";
import type { DashboardPlanner } from "@/types/dashboard-planner";

interface NextActionBannerProps {
  planner: DashboardPlanner;
}

/**
 * The single, dashboard-wide "what should I do next" recommendation
 * (Phase 2 §6-7's Priority 3) - distinct from each `PlannerCard`'s own
 * `nextAction` text, which is per-planner detail. This banner picks ONE
 * planner across the whole set (via `getRecommendedPlanner`,
 * `@/lib/dashboard-planners` - deterministic, not an AI/recommendation
 * engine) and gives it the most visually prominent position on the page,
 * directly under the welcome area and above the full grid - the thing the
 * user should look at first, not just another card among equals.
 *
 * Reuses the planner's own `nextAction` when it has one; falls back to a
 * generic "Continue where you left off" when it doesn't (a freshly-
 * started planner with nothing specific queued yet), never an empty or
 * awkward label.
 */
export function NextActionBanner({ planner }: NextActionBannerProps) {
  const isCompleted = planner.status === "completed";

  return (
    <Card variant="elevated" padding="lg" className="border-line bg-accent-subtle/60">
      <Text size="label" weight="semibold" tone="brand" className="uppercase tracking-[0.08em]">
        {isCompleted ? "Worth revisiting" : "Recommended next"}
      </Text>
      <Text as="p" size="body-lg" weight="semibold" className="mt-1.5">
        {planner.name}
      </Text>
      <Text size="body-sm" tone="muted" className="mt-1">
        {isCompleted
          ? "You completed this planner - take another look whenever you're ready."
          : (planner.nextAction ?? "Continue where you left off.")}
      </Text>
      <Button
        href={`/app/planners/${planner.slug}`}
        size="sm"
        className="mt-4"
        trailingIcon={<ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />}
      >
        {isCompleted ? "Review Planner" : "Continue Planning"}
      </Button>
    </Card>
  );
}

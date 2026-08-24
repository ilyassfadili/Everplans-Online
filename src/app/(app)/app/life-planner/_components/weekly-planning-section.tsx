"use client";

import { useState } from "react";
import { ArrowRight, Circle, CircleCheck } from "lucide-react";

import { Button, Card, EmptyState, Heading, Icon, Link, Text } from "@/components/ui";
import type { LifeWeeklyPriority } from "@/types/life-planner";

import { toggleWeeklyPriorityAction } from "../planning/weekly/actions";

interface WeeklyPlanningSectionProps {
  priorities: LifeWeeklyPriority[];
}

/**
 * The dashboard's own compact Weekly & Monthly Planning section (Life
 * Planner Prompt 4 Phase 1 §7) - the real system that replaces the "Weekly
 * & Monthly Planning" tile `FutureModulesSection` used to render as a
 * placeholder. Up to 4 not-done priorities from the current calendar week
 * (`getCurrentWeekPrioritiesForCurrentUser`,
 * `@/lib/life-planner/life-planning`), each with a completion toggle, plus
 * a "Plan your week" / "Plan your month" link pair - a glanceable summary,
 * not a second place to add/reorder priorities (the same "preview, not
 * editor" role `TodaysPrioritiesSection` plays for Life Tasks). Empty when
 * the current week has no plan row yet at all (nobody has visited Weekly
 * Planning this week) - a calm prompt to start, not an error.
 */
export function WeeklyPlanningSection({ priorities }: WeeklyPlanningSectionProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Weekly &amp; monthly planning
        </Heading>
        <Link href="/app/life-planner/planning/weekly" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
          Open planning
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {priorities.length === 0 ? (
        <EmptyState title="Nothing planned yet" description="Set this week's priorities to see them here." className="mt-4 py-6" />
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {priorities.map((priority) => (
            <PriorityRow key={priority.id} priority={priority} />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button href="/app/life-planner/planning/weekly" variant="outline" size="sm">
          Plan your week
        </Button>
        <Button href="/app/life-planner/planning/monthly" variant="outline" size="sm">
          Plan your month
        </Button>
      </div>
    </Card>
  );
}

function PriorityRow({ priority }: { priority: LifeWeeklyPriority }) {
  const [isDone, setIsDone] = useState(priority.isDone);
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    // Optimistic - flips immediately, then reconciles with the server's own
    // answer, the same shape `HabitRow`'s completion toggle
    // (`TodaysHabitsSection`) uses.
    setIsToggling(true);
    setIsDone((current) => !current);
    const result = await toggleWeeklyPriorityAction(priority.id);
    setIsToggling(false);
    if (result.status === "success") {
      setIsDone(result.priority.isDone);
    } else {
      setIsDone((current) => !current);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={isToggling}
      aria-label={`Mark "${priority.title}" ${isDone ? "not done" : "done"}`}
      className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface p-3 text-left disabled:opacity-60"
    >
      <Icon icon={isDone ? CircleCheck : Circle} size="sm" className={isDone ? "shrink-0 text-success" : "shrink-0 text-ink-faint"} />
      <Text size="body-sm" className={isDone ? "truncate text-ink-faint line-through" : "truncate text-ink"}>
        {priority.title}
      </Text>
    </button>
  );
}

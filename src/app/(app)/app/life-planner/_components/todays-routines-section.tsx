"use client";

import { useState } from "react";
import { ArrowRight, Circle, CircleCheck } from "lucide-react";

import { Button, Card, EmptyState, Heading, Icon, Link, Text } from "@/components/ui";
import type { LifeRoutineCompletion, LifeRoutineItem } from "@/types/life-planner";
import type { TodaysRoutineGroup } from "@/lib/life-planner/life-routines";

import { toggleRoutineItemCompletionAction } from "../routines/actions";

interface TodaysRoutinesSectionProps {
  groups: TodaysRoutineGroup[];
  /** Today's local date as `YYYY-MM-DD`, computed server-side (`page.tsx`) so every completion toggle in this section stamps the same day the server used to decide which routines are "due today" - avoids a client/server midnight mismatch the same way `todayIso()` helpers elsewhere in this module guard against. */
  today: string;
}

/**
 * The dashboard's own "Routines" half of the combined "Today's habits &
 * routines" section (Phase 2 §5; Phase 3 §7 adds `TodaysHabitsSection` as
 * its sibling, both composed together by `page.tsx`). Active routines due
 * today (`getTodaysRoutineItemsForCurrentUser`,
 * `@/lib/life-planner/life-routines`), each rendered as a compact group of
 * its own checklist items with inline completion toggles - a glanceable,
 * actionable summary, not a second place to edit a routine's own items (the
 * same "preview, not editor" role `TodaysPrioritiesSection` plays for Life
 * Tasks).
 */
export function TodaysRoutinesSection({ groups, today }: TodaysRoutinesSectionProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h3" size="h4">
          Routines
        </Heading>
        <Link href="/app/life-planner/routines" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
          View all routines
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="Nothing scheduled today"
          description="Routines due today will show up here."
          action={
            <Button href="/app/life-planner/routines/new" size="sm" variant="outline">
              New routine
            </Button>
          }
          className="mt-4 py-6"
        />
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {groups.map((group) => (
            <RoutineGroup key={group.routine.id} name={group.routine.name} items={group.items} completions={group.completions} today={today} />
          ))}
        </div>
      )}
    </Card>
  );
}

interface RoutineGroupProps {
  name: string;
  items: LifeRoutineItem[];
  completions: LifeRoutineCompletion[];
  today: string;
}

function RoutineGroup({ name, items, completions, today }: RoutineGroupProps) {
  const [completedIds, setCompletedIds] = useState(() => new Set(completions.map((completion) => completion.routineItemId)));

  async function handleToggle(itemId: string) {
    // Optimistic - flips immediately, then reconciles with the server's own
    // answer, the same shape `PriorityRow`'s completion toggle uses one
    // section up.
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

    const result = await toggleRoutineItemCompletionAction(itemId, today);
    if (result.status === "success") {
      setCompletedIds((current) => {
        const next = new Set(current);
        if (result.completed) next.add(itemId);
        else next.delete(itemId);
        return next;
      });
    }
  }

  const doneCount = items.filter((item) => completedIds.has(item.id)).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Text size="body-sm" weight="medium" className="text-ink">
          {name}
        </Text>
        <Text size="body-sm" tone="faint">
          {doneCount}/{items.length}
        </Text>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => {
          const done = completedIds.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => void handleToggle(item.id)}
              className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface p-2.5 text-left transition-colors duration-150 ease-standard hover:bg-surface-muted"
            >
              <Icon icon={done ? CircleCheck : Circle} size="sm" className={done ? "shrink-0 text-success" : "shrink-0 text-ink-faint"} />
              <Text size="body-sm" className={done ? "truncate text-ink-muted line-through" : "truncate text-ink"}>
                {item.title}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
}

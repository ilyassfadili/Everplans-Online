"use client";

import { useState } from "react";

import { Checkbox, Text } from "@/components/ui";
import type { LifeRoutineCompletion, LifeRoutineItem } from "@/types/life-planner";

import { toggleRoutineItemCompletionAction } from "../../actions";

interface TodaysChecklistProps {
  items: LifeRoutineItem[];
  completions: LifeRoutineCompletion[];
}

/** Today's local calendar date as `YYYY-MM-DD` - never `toISOString()`, which is UTC and can land on the wrong day near midnight (same construction every other date helper in this module uses). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * The routine detail page's own "Today's checklist" mini-section (Phase 2
 * §4) - rendered only when the routine is actually due today (the page's
 * own `todaysGroup` is non-null), so a routine that isn't scheduled for
 * today never shows a checklist that would be misleading to check off. Each
 * item's checked state is derived from whether a completion for it exists
 * in today's `completions`, not tracked as a separate boolean - the log
 * itself is the source of truth.
 */
export function TodaysChecklist({ items, completions }: TodaysChecklistProps) {
  const completedItemIds = new Set(completions.map((completion) => completion.routineItemId));

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <ChecklistRow key={item.id} item={item} completed={completedItemIds.has(item.id)} />
      ))}
    </div>
  );
}

function ChecklistRow({ item, completed }: { item: LifeRoutineItem; completed: boolean }) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDone, setIsDone] = useState(completed);

  async function handleToggle() {
    setIsToggling(true);
    const result = await toggleRoutineItemCompletionAction(item.id, todayIso());
    setIsToggling(false);
    if (result.status === "success") {
      setIsDone(result.completed);
    }
  }

  return (
    <label className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface p-3">
      <Checkbox checked={isDone} onChange={() => void handleToggle()} disabled={isToggling} />
      <Text size="body-sm" className={isDone ? "text-ink-muted line-through" : "text-ink"}>
        {item.title}
      </Text>
    </label>
  );
}

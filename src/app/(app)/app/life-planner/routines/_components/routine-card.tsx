"use client";

import { useState } from "react";
import { Pause, Play, Trash2 } from "lucide-react";

import { Badge, Button, Card, Link, Text } from "@/components/ui";
import type { LifeRoutine } from "@/types/life-planner";

import { activateRoutineAction, deactivateRoutineAction, deleteRoutineAction } from "../actions";
import { describeRoutineFrequency, ROUTINE_TYPE_LABEL } from "./routine-visuals";

interface RoutineCardProps {
  routine: LifeRoutine;
  /** How many items this routine has (`getRoutineItemCountsForCurrentUser`, `@/lib/life-planner/life-routines`) - `0` for "none yet," never omitted. */
  itemCount: number;
}

/**
 * One Routine card - the Routines list page's own summary tile (Phase 2
 * §4): name, type badge, frequency in plain language
 * (`describeRoutineFrequency`), item count, and a pause/resume toggle plus
 * delete, all without leaving the list. Editing the routine's own fields
 * (name, purpose, type, frequency, days) happens on its detail page, not
 * inline here - the same "list card is a summary + light actions, the
 * detail page is where you edit" split `TaskRow` draws for Life Tasks.
 */
export function RoutineCard({ routine, itemCount }: RoutineCardProps) {
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleActive() {
    setIsTogglingActive(true);
    const result = routine.isActive ? await deactivateRoutineAction(routine.id) : await activateRoutineAction(routine.id);
    setIsTogglingActive(false);
    setError(result.status === "success" ? null : (result.message ?? "Couldn't update that routine."));
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${routine.name}"? This can't be undone.`)) return;
    setIsDeleting(true);
    const result = await deleteRoutineAction(routine.id);
    setIsDeleting(false);
    if (result.status !== "success") setError(result.message ?? "Couldn't remove that routine.");
  }

  return (
    <Card variant="standard" padding="lg" className={`flex flex-col gap-4 ${routine.isActive ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/app/life-planner/routines/${routine.id}`} variant="inline" className="text-body-lg font-semibold text-ink no-underline hover:underline">
            {routine.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{ROUTINE_TYPE_LABEL[routine.routineType]}</Badge>
            {!routine.isActive && <Badge variant="neutral">Paused</Badge>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Text size="body-sm" tone="muted">
          {describeRoutineFrequency(routine)}
        </Text>
        <Text size="body-sm" tone="faint">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </Text>
      </div>

      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}

      <div className="mt-auto flex items-center gap-1 border-t border-line-subtle pt-3">
        <Button variant="ghost" size="sm" onClick={() => void handleToggleActive()} loading={isTogglingActive}>
          {routine.isActive ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {routine.isActive ? "Pause" : "Resume"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleDelete()} loading={isDeleting}>
          <Trash2 className="size-4" aria-hidden="true" />
          Remove
        </Button>
      </div>
    </Card>
  );
}

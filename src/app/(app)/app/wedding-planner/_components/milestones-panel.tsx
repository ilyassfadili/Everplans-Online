"use client";

import { useActionState, useState, useTransition } from "react";
import { Flag } from "lucide-react";

import { Alert, Badge, Button, Card, DatePicker, EmptyState, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { useCelebration } from "@/components/wedding/use-celebration";
import { cn } from "@/lib/cn";
import type { WeddingMilestone, WeddingPlanningStatus } from "@/types/wedding";

import { createMilestoneFormAction, setMilestoneStatusAction, type CreateMilestoneFormState } from "../actions";
import { PanelHeader } from "./panel-header";

const STATUS_LABEL: Record<WeddingPlanningStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Done",
};

const STATUS_VARIANT: Record<WeddingPlanningStatus, "outline" | "brand" | "success"> = {
  "not-started": "outline",
  "in-progress": "brand",
  completed: "success",
};

// Clicking a milestone's status advances it - not-started -> in-progress
// -> completed -> back to not-started. One control instead of three radio
// options, since milestones are few and this keeps the row compact.
const NEXT_STATUS: Record<WeddingPlanningStatus, WeddingPlanningStatus> = {
  "not-started": "in-progress",
  "in-progress": "completed",
  completed: "not-started",
};

const initialFormState: CreateMilestoneFormState = { status: "idle" };

interface MilestonesPanelProps {
  weddingId: string;
  milestones: WeddingMilestone[];
}

/**
 * The dashboard's milestone checkpoints (Phase 2). Read + create + status
 * cycling live here; there's no separate "edit milestone" flow yet - only
 * the fields Phase 2 actually asks for (title, target date, status).
 */
export function MilestonesPanel({ weddingId, milestones }: MilestonesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createMilestoneFormAction.bind(null, weddingId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialFormState);
  const [, startStatusTransition] = useTransition();
  const { message: celebration, celebrate } = useCelebration();

  function handleAdvanceStatus(milestoneId: string, current: WeddingPlanningStatus) {
    const next = NEXT_STATUS[current];
    startStatusTransition(() => {
      setMilestoneStatusAction(milestoneId, next);
    });
    if (next === "completed") celebrate();
  }

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Flag}
        title="Your Wedding Journey"
        action={
          !isAdding && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              Add milestone
            </Button>
          )
        }
      />
      <Text
        size="caption"
        weight="medium"
        aria-live="polite"
        className={cn(
          "mt-1 text-brand transition-opacity duration-300 ease-standard motion-reduce:transition-none",
          celebration ? "opacity-100" : "opacity-0",
        )}
      >
        {celebration || " "}
      </Text>

      {milestones.length === 0 && !isAdding && (
        <EmptyState
          icon={Flag}
          title="Your journey starts here"
          description="Mark the big moments as you go - booking the venue, sending invitations, the ones you'll want to look back on."
          className="py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add your first milestone
            </Button>
          }
        />
      )}

      {milestones.length > 0 && (
        <ul className="mt-4 flex flex-1 flex-col divide-y divide-line-subtle">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="flex items-center justify-between gap-3 py-2.5">
              <Text
                size="body"
                weight="medium"
                className={milestone.status === "completed" ? "text-ink-faint line-through" : "text-ink"}
              >
                {milestone.title}
              </Text>
              <button
                type="button"
                onClick={() => handleAdvanceStatus(milestone.id, milestone.status)}
                aria-label={`Mark "${milestone.title}" as ${STATUS_LABEL[NEXT_STATUS[milestone.status]]}`}
                // Padding expands the tap target to a comfortable mobile
                // size without growing the badge's own visual footprint -
                // the negative margin cancels the padding out again for
                // layout purposes.
                className="-m-2 rounded-full p-2"
              >
                <Badge variant={STATUS_VARIANT[milestone.status]}>{STATUS_LABEL[milestone.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn’t add that milestone">
              {formState.message}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input name="title" placeholder="e.g. Book the venue" maxLength={150} aria-label="Milestone title" required />
            <DatePicker name="targetDate" aria-label="Target date (optional)" className="sm:w-40" />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add milestone
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

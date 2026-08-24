"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import { Alert, Badge, Button, Card, FormField, Heading, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { DatePicker } from "@/components/ui/form/date-picker";
import type { LifeArea, LifeGoal, LifeGoalActionStep, LifeGoalMilestone, LifeHabit, LifeImportantItem, LifeJournalEntry, LifeTask } from "@/types/life-planner";

import { deleteLifeGoalAction, updateLifeGoalAction } from "../../actions";
import { GoalAreaSelect, normalizeAreaId } from "../../_components/goal-area-select";
import { formatGoalDate, PRIORITY_BADGE, PRIORITY_LABEL, PRIORITY_OPTIONS, STATUS_BADGE, STATUS_LABEL } from "../../_components/goal-visuals";
import { GoalActionSteps } from "./goal-action-steps";
import { GoalHabits } from "./goal-habits";
import { GoalImportantItems } from "./goal-important-items";
import { GoalJournalReflections } from "./goal-journal-reflections";
import { GoalMilestones } from "./goal-milestones";
import { GoalStatusProgressCard, type GoalProgressSource } from "./goal-status-progress-card";
import { GoalTasks } from "./goal-tasks";

interface GoalDetailViewProps {
  goal: LifeGoal;
  areas: LifeArea[];
  area: LifeArea | null;
  areaIcon: LucideIcon | null;
  milestones: LifeGoalMilestone[];
  actionSteps: LifeGoalActionStep[];
  tasks: LifeTask[];
  habits: LifeHabit[];
  /** Today's logged state per habit id - see `GoalHabits`'s own comment. */
  todayLoggedByHabitId: Record<string, boolean>;
  journalEntries: LifeJournalEntry[];
  importantItems: LifeImportantItem[];
  today: string;
}

/**
 * The goal detail page's own content (Phase 2 §4) - the main info card
 * (title/description/area/priority/target date/notes) as a single
 * view/edit-in-place card, the same "swap the card's own content, no
 * separate route or modal" toggle `AreaCard`/`VendorDetailView` already
 * use, plus a dedicated `GoalStatusProgressCard` for the two fields that
 * change far more often. Componentized this way (not one monolithic file)
 * since Phase 3 substantially extends this same page with
 * milestones/action steps - each addition gets its own card/component
 * rather than growing one giant function.
 *
 * Phase 3 adds the "Milestones" and "Action steps" sections below the
 * status card, plus the `progressSource` derivation that tells
 * `GoalStatusProgressCard` whether `progress` is still a plain manual
 * number (neither list has anything yet) or now computed from one of them
 * (see that component's own comment for the exact precedence rule).
 */
export function GoalDetailView({ goal, areas, area, areaIcon: AreaIcon, milestones, actionSteps, tasks, habits, todayLoggedByHabitId, journalEntries, importantItems, today }: GoalDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressSource: GoalProgressSource = actionSteps.length > 0 ? "action_steps" : milestones.length > 0 ? "milestones" : null;
  const hasNoPlanningItems = milestones.length === 0 && actionSteps.length === 0;

  async function handleSave(formData: FormData) {
    const title = formData.get("title");
    const description = formData.get("description");
    const lifeAreaId = formData.get("lifeAreaId");
    const targetDate = formData.get("targetDate");
    const priority = formData.get("priority");
    const notes = formData.get("notes");

    setIsSaving(true);
    const result = await updateLifeGoalAction(goal.id, {
      title: typeof title === "string" ? title : undefined,
      description: typeof description === "string" ? description : "",
      lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : "",
      targetDate: typeof targetDate === "string" ? targetDate : "",
      priority: typeof priority === "string" ? (priority as LifeGoal["priority"]) : undefined,
      notes: typeof notes === "string" ? notes : "",
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleDelete() {
    if (!window.confirm(`Remove "${goal.title}"? This can't be undone.`)) {
      return;
    }
    void deleteLifeGoalAction(goal.id);
    router.push("/app/life-planner/goals");
  }

  const targetDateLabel = formatGoalDate(goal.targetDate);

  return (
    <div className="flex flex-col gap-6">
      <Card variant="standard" padding="lg">
        {isEditing ? (
          <form action={handleSave} className="flex flex-col gap-4">
            {error && (
              <Alert variant="error" title="Couldn't save that change">
                {error}
              </Alert>
            )}

            <FormField label="Title">
              <Input name="title" defaultValue={goal.title} maxLength={120} required />
            </FormField>

            <FormField label="Description">
              <Textarea name="description" rows={3} maxLength={1000} defaultValue={goal.description ?? ""} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Life Area">
                <GoalAreaSelect areas={areas} defaultValue={goal.lifeAreaId ?? undefined} />
              </FormField>
              <FormField label="Priority">
                <Select name="priority" defaultValue={goal.priority} options={PRIORITY_OPTIONS} aria-label="Priority" />
              </FormField>
            </div>

            <FormField label="Target date">
              <DatePicker name="targetDate" defaultValue={goal.targetDate ?? ""} aria-label="Target date" />
            </FormField>

            <FormField label="Notes">
              <Textarea name="notes" rows={3} maxLength={1000} defaultValue={goal.notes ?? ""} />
            </FormField>

            <div className="flex items-center gap-3">
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Heading as="h1" size="h3">
                  {goal.title}
                </Heading>
                {area && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-ink-muted">
                    {AreaIcon && <Icon icon={AreaIcon} size="sm" />}
                    <Text size="body-sm" tone="muted">
                      {area.name}
                    </Text>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={STATUS_BADGE[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-subtle pt-4">
              <Badge variant={PRIORITY_BADGE[goal.priority]}>{PRIORITY_LABEL[goal.priority]}</Badge>
              {targetDateLabel && (
                <Text size="body-sm" tone="muted">
                  Target: {targetDateLabel}
                </Text>
              )}
            </div>

            {goal.description && (
              <Text size="body-sm" tone="muted" className="mt-4 border-t border-line-subtle pt-4">
                {goal.description}
              </Text>
            )}

            {goal.notes && (
              <div className="mt-4 border-t border-line-subtle pt-4">
                <Text size="body-sm" weight="medium" className="text-ink">
                  Notes
                </Text>
                <Text size="body-sm" tone="muted" className="mt-1">
                  {goal.notes}
                </Text>
              </div>
            )}
          </>
        )}
      </Card>

      <GoalStatusProgressCard goal={goal} progressSource={progressSource} />

      <Card variant="standard" padding="lg" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Heading as="h2" size="h4">
            Milestones
          </Heading>
          <GoalMilestones goalId={goal.id} milestones={milestones} />
        </div>

        <div className="flex flex-col gap-4 border-t border-line-subtle pt-6">
          <Heading as="h2" size="h4">
            Action steps
          </Heading>
          <GoalActionSteps goalId={goal.id} milestones={milestones} actionSteps={actionSteps} />
        </div>

        {hasNoPlanningItems && (
          <Text size="body-sm" tone="faint" className="border-t border-line-subtle pt-4">
            Break this goal into milestones or action steps whenever you&rsquo;re ready.
          </Text>
        )}
      </Card>

      <Card variant="standard" padding="lg" className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          Tasks for this goal
        </Heading>
        <GoalTasks tasks={tasks} />
      </Card>

      <Card variant="standard" padding="lg" className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          Habits for this goal
        </Heading>
        <GoalHabits habits={habits} todayLoggedByHabitId={todayLoggedByHabitId} today={today} />
      </Card>

      <Card variant="standard" padding="lg" className="flex flex-col gap-4 border-line-subtle/60">
        <Heading as="h2" size="h4">
          Journal reflections
        </Heading>
        <GoalJournalReflections goalId={goal.id} entries={journalEntries} />
      </Card>

      <Card variant="standard" padding="lg" className="flex flex-col gap-4 border-line-subtle/60">
        <Heading as="h2" size="h4">
          Important information
        </Heading>
        <GoalImportantItems goalId={goal.id} items={importantItems} />
      </Card>

      <Button variant="ghost" size="sm" className="self-start text-error hover:text-error" onClick={handleDelete}>
        Remove goal
      </Button>
    </div>
  );
}

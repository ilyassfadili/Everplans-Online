"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { Alert, Badge, Button, Card, FormField, Heading, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { HabitProgress } from "@/lib/life-planner/life-habits";
import type { LifeArea, LifeGoal, LifeHabit, LifeHabitFrequency, LifeHabitLog } from "@/types/life-planner";

import { deleteHabitAction, toggleHabitLogForDateAction, updateHabitAction } from "../../actions";
import { GoalAreaSelect, normalizeAreaId } from "../../../goals/_components/goal-area-select";
import { HabitGoalSelect, normalizeGoalId } from "../../_components/habit-goal-select";
import { describeHabitFrequency, describeHabitProgress, describeHabitStreak, FREQUENCY_OPTIONS } from "../../_components/habit-visuals";
import { HabitProgressBar } from "../../_components/habit-progress-bar";
import { HabitHistory } from "./habit-history";

interface HabitDetailViewProps {
  habit: LifeHabit;
  areas: LifeArea[];
  goals: LifeGoal[];
  area: LifeArea | null;
  goal: LifeGoal | null;
  progress: HabitProgress;
  todayLogged: boolean;
  logs: LifeHabitLog[];
  /** Today's local date as `YYYY-MM-DD`, computed server-side (`page.tsx`) so the log toggle stamps the exact day this same render used to compute `progress`. */
  today: string;
}

/**
 * One Habit's detail view (Phase 3 §5) - the main info card
 * (name/description/area/goal/frequency/target) as a single
 * view/edit-in-place card, the same "swap the card's own content, no
 * separate route or modal" toggle `RoutineDetailView`/`GoalDetailView`
 * already use, plus a compact progress card (today's log toggle, streak,
 * this-period progress) and the "last 14 days" history strip
 * (`HabitHistory`).
 */
export function HabitDetailView({ habit, areas, goals, area, goal, progress, todayLogged, logs, today }: HabitDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<LifeHabitFrequency>(habit.frequency);
  const needsTargetPerPeriod = frequency !== "daily";

  const [isLogged, setIsLogged] = useState(todayLogged);
  const [isToggling, setIsToggling] = useState(false);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const description = formData.get("description");
    const lifeAreaId = formData.get("lifeAreaId");
    const goalId = formData.get("goalId");
    const targetPerPeriod = formData.get("targetPerPeriod");

    setIsSaving(true);
    const result = await updateHabitAction(habit.id, {
      name: typeof name === "string" ? name : undefined,
      description: typeof description === "string" ? description : "",
      lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : "",
      goalId: typeof goalId === "string" ? normalizeGoalId(goalId) : "",
      frequency,
      targetPerPeriod: needsTargetPerPeriod && typeof targetPerPeriod === "string" && targetPerPeriod ? Number(targetPerPeriod) : 1,
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function startEditing() {
    setFrequency(habit.frequency);
    setIsEditing(true);
  }

  function handleDelete() {
    if (!window.confirm(`Remove "${habit.name}"? This can't be undone.`)) {
      return;
    }
    void deleteHabitAction(habit.id);
    router.push("/app/life-planner/habits");
  }

  async function handleToggleLog() {
    setIsToggling(true);
    setIsLogged((current) => !current);
    const result = await toggleHabitLogForDateAction(habit.id, today);
    setIsToggling(false);
    if (result.status === "success") {
      setIsLogged(result.logged);
    } else {
      setIsLogged((current) => !current);
      setError(result.message ?? "Couldn't update that habit.");
    }
  }

  const streakLabel = describeHabitStreak(habit, progress.currentStreak);

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

            <FormField label="Name">
              <Input name="name" defaultValue={habit.name} maxLength={80} required />
            </FormField>

            <FormField label="Description">
              <Textarea name="description" rows={2} maxLength={300} defaultValue={habit.description ?? ""} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Life Area">
                <GoalAreaSelect areas={areas} defaultValue={habit.lifeAreaId ?? undefined} />
              </FormField>
              <FormField label="Goal">
                <HabitGoalSelect goals={goals} defaultValue={habit.goalId ?? undefined} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Frequency">
                <Select
                  name="frequency"
                  defaultValue={habit.frequency}
                  options={FREQUENCY_OPTIONS}
                  aria-label="Frequency"
                  onValueChange={(value) => setFrequency(value as LifeHabitFrequency)}
                />
              </FormField>
              {needsTargetPerPeriod && (
                <FormField label="Times per week" hint="1-14.">
                  <Input name="targetPerPeriod" type="number" min={1} max={14} defaultValue={habit.targetPerPeriod} aria-label="Times per week" />
                </FormField>
              )}
            </div>

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
                  {habit.name}
                </Heading>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {area && <Badge variant="outline">{area.name}</Badge>}
                  {goal && <Badge variant="outline">{goal.title}</Badge>}
                  {!habit.isActive && <Badge variant="neutral">Paused</Badge>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={startEditing}>
                Edit
              </Button>
            </div>

            <div className="mt-4 border-t border-line-subtle pt-4">
              <Text size="body-sm" tone="muted">
                {describeHabitFrequency(habit)}
              </Text>
            </div>

            {habit.description && (
              <Text size="body-sm" tone="muted" className="mt-4 border-t border-line-subtle pt-4">
                {habit.description}
              </Text>
            )}
          </>
        )}
      </Card>

      {habit.isActive && (
        <Card variant="standard" padding="lg" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Heading as="h2" size="h4">
              Progress
            </Heading>
            <button
              type="button"
              onClick={() => void handleToggleLog()}
              disabled={isToggling}
              aria-label={isLogged ? `Mark "${habit.name}" not done today` : `Mark "${habit.name}" done today`}
              className="flex shrink-0 items-center gap-2 disabled:opacity-60"
            >
              <Icon icon={isLogged ? CheckCircle2 : Circle} size="lg" className={isLogged ? "text-success" : "text-ink-faint"} />
              <Text size="body-sm" className={isLogged ? "text-success" : "text-ink-muted"}>
                {isLogged ? "Logged today" : "Log today"}
              </Text>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Text size="body-sm" tone="faint">
                {describeHabitProgress(habit, progress)}
              </Text>
              {streakLabel && (
                <Text size="body-sm" tone="faint">
                  {streakLabel}
                </Text>
              )}
            </div>
            <HabitProgressBar completed={progress.completedInPeriod} target={progress.targetInPeriod} />
          </div>

          <div className="border-t border-line-subtle pt-4">
            <HabitHistory logs={logs} />
          </div>
        </Card>
      )}

      <Button variant="ghost" size="sm" className="self-start text-error hover:text-error" onClick={handleDelete}>
        Remove habit
      </Button>
    </div>
  );
}

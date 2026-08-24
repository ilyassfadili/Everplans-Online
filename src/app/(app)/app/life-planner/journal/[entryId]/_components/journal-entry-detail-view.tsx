"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Card, DatePicker, FormField, Heading, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea, LifeGoal, LifeJournalEntry } from "@/types/life-planner";

import { archiveJournalEntryAction, deleteJournalEntryAction, unarchiveJournalEntryAction, updateJournalEntryAction } from "../../actions";
import { GoalAreaSelect, normalizeAreaId } from "../../../goals/_components/goal-area-select";
import { NO_GOAL_VALUE, TaskGoalSelect, normalizeGoalId } from "../../../tasks/_components/task-goal-select";
import { formatJournalDate } from "../../_components/journal-visuals";

interface JournalEntryDetailViewProps {
  entry: LifeJournalEntry;
  areas: LifeArea[];
  goals: LifeGoal[];
}

/**
 * The Journal entry detail page's own content (Life Planner Prompt 4
 * Phase 2) - a single view/edit-in-place card, the same "swap the card's
 * own content, no separate route or modal" toggle `GoalDetailView`/
 * `TaskDetailView` already use one product over. Kept visually warm and
 * quiet like the list's own `JournalEntryCard` - generous padding, a
 * softened border, and the entry body rendered as plain, roomy prose
 * (`whitespace-pre-wrap` so paragraph breaks the writer typed are honored)
 * rather than a dense info-card layout.
 *
 * Both `archiveJournalEntryAction`/`unarchiveJournalEntryAction` (the
 * primary "remove from view" path) and `deleteJournalEntryAction` (a
 * genuine, permanent removal) are offered here, the same "archive is
 * primary, delete is still real" shape `TaskDetailView` establishes for
 * `life_tasks` - see `life-journal.ts`'s own comment on why this table
 * carries both.
 */
export function JournalEntryDetailView({ entry, areas, goals }: JournalEntryDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const title = formData.get("title");
    const content = formData.get("content");
    const entryDate = formData.get("entryDate");
    const lifeAreaId = formData.get("lifeAreaId");
    const goalId = formData.get("goalId");

    setIsSaving(true);
    const result = await updateJournalEntryAction(entry.id, {
      title: typeof title === "string" ? title : undefined,
      content: typeof content === "string" ? content : undefined,
      entryDate: typeof entryDate === "string" ? entryDate : undefined,
      lifeAreaId: typeof lifeAreaId === "string" ? normalizeAreaId(lifeAreaId) : "",
      goalId: typeof goalId === "string" ? normalizeGoalId(goalId) : "",
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  async function handleArchiveToggle() {
    setIsArchiving(true);
    const result = entry.isArchived ? await unarchiveJournalEntryAction(entry.id) : await archiveJournalEntryAction(entry.id);
    setIsArchiving(false);
    if (result.status !== "success") {
      setError(result.message ?? "Couldn't update that entry.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Permanently delete "${entry.title}"? This can't be undone.`)) {
      return;
    }
    setIsDeleting(true);
    const result = await deleteJournalEntryAction(entry.id, entry.goalId);
    setIsDeleting(false);
    if (result.status === "success") {
      router.push("/app/life-planner/journal");
    } else {
      setError(result.message ?? "Couldn't delete that entry.");
    }
  }

  const area = entry.lifeAreaId ? (areas.find((candidate) => candidate.id === entry.lifeAreaId) ?? null) : null;
  const goal = entry.goalId ? (goals.find((candidate) => candidate.id === entry.goalId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <Card variant="standard" padding="lg" className="border-line-subtle/60">
        {isEditing ? (
          <form action={handleSave} className="flex flex-col gap-5">
            {error && (
              <Alert variant="error" title="Couldn't save that change">
                {error}
              </Alert>
            )}

            <FormField label="Title">
              <Input name="title" defaultValue={entry.title} maxLength={140} required />
            </FormField>

            <FormField label="Date">
              <DatePicker name="entryDate" defaultValue={entry.entryDate} aria-label="Entry date" />
            </FormField>

            <FormField label="Your entry">
              <Textarea name="content" rows={14} maxLength={10000} defaultValue={entry.content} className="leading-relaxed" required />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Life Area">
                <GoalAreaSelect areas={areas} defaultValue={entry.lifeAreaId ?? undefined} />
              </FormField>
              <FormField label="Goal">
                <TaskGoalSelect goals={goals} defaultValue={entry.goalId ?? NO_GOAL_VALUE} />
              </FormField>
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
                <Text size="body-sm" tone="faint">
                  {formatJournalDate(entry.entryDate)}
                </Text>
                <Heading as="h1" size="h3" className="mt-1">
                  {entry.title}
                </Heading>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {entry.isArchived && <Badge variant="neutral">Archived</Badge>}
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>

            {(area || goal) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-subtle/60 pt-4">
                {area && (
                  <Text size="body-sm" tone="muted">
                    {area.name}
                  </Text>
                )}
                {area && goal && <span aria-hidden="true">·</span>}
                {goal && (
                  <Text size="body-sm" tone="muted">
                    {goal.title}
                  </Text>
                )}
              </div>
            )}

            <Text as="div" size="body-lg" tone="default" className="mt-6 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </Text>

            {error && (
              <Text size="body-sm" tone="error" className="mt-4">
                {error}
              </Text>
            )}
          </>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => void handleArchiveToggle()} disabled={isArchiving}>
          {entry.isArchived ? "Restore entry" : "Archive entry"}
        </Button>
        <Button variant="ghost" size="sm" className="text-error hover:text-error" onClick={() => void handleDelete()} disabled={isDeleting}>
          Delete permanently
        </Button>
      </div>
    </div>
  );
}

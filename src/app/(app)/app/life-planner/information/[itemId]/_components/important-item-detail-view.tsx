"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Card, FormField, Heading, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea, LifeGoal, LifeImportantItem, LifeImportantItemCategory } from "@/types/life-planner";

import { archiveImportantItemAction, deleteImportantItemAction, unarchiveImportantItemAction, updateImportantItemAction } from "../../actions";
import { GoalAreaSelect, normalizeAreaId } from "../../../goals/_components/goal-area-select";
import { NO_GOAL_VALUE, TaskGoalSelect, normalizeGoalId } from "../../../tasks/_components/task-goal-select";
import { ImportantItemCategorySelect } from "../../_components/important-item-category-select";
import { IMPORTANT_ITEM_CATEGORY_BADGE, IMPORTANT_ITEM_CATEGORY_LABEL } from "../../_components/important-item-visuals";

interface ImportantItemDetailViewProps {
  item: LifeImportantItem;
  areas: LifeArea[];
  goals: LifeGoal[];
}

/**
 * The Important Item detail page's own content (Life Planner Prompt 4
 * Phase 3) - a single view/edit-in-place card, the same "swap the card's
 * own content, no separate route or modal" toggle `JournalEntryDetailView`/
 * `GoalDetailView` already use elsewhere in this product.
 *
 * Both `archiveImportantItemAction`/`unarchiveImportantItemAction` (the
 * primary "remove from view" path) and `deleteImportantItemAction` (a
 * genuine, permanent removal) are offered here, the same "archive is
 * primary, delete is still real" shape `JournalEntryDetailView` establishes
 * one module over.
 */
export function ImportantItemDetailView({ item, areas, goals }: ImportantItemDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const title = formData.get("title");
    const content = formData.get("content");
    const category = formData.get("category");
    const lifeAreaId = formData.get("lifeAreaId");
    const goalId = formData.get("goalId");

    setIsSaving(true);
    const result = await updateImportantItemAction(item.id, {
      title: typeof title === "string" ? title : undefined,
      content: typeof content === "string" ? content : undefined,
      category: typeof category === "string" ? (category as LifeImportantItemCategory) : undefined,
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
    const result = item.isArchived ? await unarchiveImportantItemAction(item.id) : await archiveImportantItemAction(item.id);
    setIsArchiving(false);
    if (result.status !== "success") {
      setError(result.message ?? "Couldn't update that item.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Permanently delete "${item.title}"? This can't be undone.`)) {
      return;
    }
    setIsDeleting(true);
    const result = await deleteImportantItemAction(item.id, item.goalId);
    setIsDeleting(false);
    if (result.status === "success") {
      router.push("/app/life-planner/information");
    } else {
      setError(result.message ?? "Couldn't delete that item.");
    }
  }

  const area = item.lifeAreaId ? (areas.find((candidate) => candidate.id === item.lifeAreaId) ?? null) : null;
  const goal = item.goalId ? (goals.find((candidate) => candidate.id === item.goalId) ?? null) : null;

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
              <Input name="title" defaultValue={item.title} maxLength={140} required />
            </FormField>

            <FormField label="Category">
              <ImportantItemCategorySelect defaultValue={item.category} />
            </FormField>

            <FormField label="Details">
              <Textarea name="content" rows={12} maxLength={5000} defaultValue={item.content} className="leading-relaxed" required />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Life Area">
                <GoalAreaSelect areas={areas} defaultValue={item.lifeAreaId ?? undefined} />
              </FormField>
              <FormField label="Goal">
                <TaskGoalSelect goals={goals} defaultValue={item.goalId ?? NO_GOAL_VALUE} />
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
                <Badge variant={IMPORTANT_ITEM_CATEGORY_BADGE[item.category]}>{IMPORTANT_ITEM_CATEGORY_LABEL[item.category]}</Badge>
                <Heading as="h1" size="h3" className="mt-2">
                  {item.title}
                </Heading>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.isArchived && <Badge variant="neutral">Archived</Badge>}
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
              {item.content}
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
          {item.isArchived ? "Restore item" : "Archive item"}
        </Button>
        <Button variant="ghost" size="sm" className="text-error hover:text-error" onClick={() => void handleDelete()} disabled={isDeleting}>
          Delete permanently
        </Button>
      </div>
    </div>
  );
}

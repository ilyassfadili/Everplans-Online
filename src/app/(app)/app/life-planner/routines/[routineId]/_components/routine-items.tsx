"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { Alert, Button, FormField, Icon, Input, Text } from "@/components/ui";
import type { LifeRoutineItem } from "@/types/life-planner";

import { addRoutineItemFormAction, deleteRoutineItemAction, moveRoutineItemAction, updateRoutineItemAction, type AddRoutineItemFormState } from "../../actions";

const initialState: AddRoutineItemFormState = { status: "idle" };

const iconButtonClass =
  "-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface RoutineItemsProps {
  routineId: string;
  items: LifeRoutineItem[];
}

/**
 * The routine detail page's own "Checklist items" section (Phase 2 §4) - a
 * plain ordered list with rename-in-place, reorder, delete, and an inline
 * "Add item" form, the same "expand in place, no modal" pattern
 * `GoalMilestones` already establishes for a sibling child-list.
 */
export function RoutineItems({ routineId, items }: RoutineItemsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const addAction = addRoutineItemFormAction.bind(null, routineId);
  const [formState, formAction, isCreating] = useActionState(addAction, initialState);

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <Text size="body-sm" tone="muted">
          No checklist items yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <RoutineItemRow key={item.id} item={item} isFirst={index === 0} isLast={index === items.length - 1} />
          ))}
        </div>
      )}

      {isAdding ? (
        <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-muted/40 p-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that item">
              {formState.message}
            </Alert>
          )}

          <FormField label="Title">
            <Input name="title" placeholder="e.g. Make the bed" maxLength={120} required autoFocus />
          </FormField>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add item
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} disabled={isCreating}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setIsAdding(true)}>
          Add item
        </Button>
      )}
    </div>
  );
}

interface RoutineItemRowProps {
  item: LifeRoutineItem;
  isFirst: boolean;
  isLast: boolean;
}

function RoutineItemRow({ item, isFirst, isLast }: RoutineItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRename(formData: FormData) {
    const title = formData.get("title");
    setIsSaving(true);
    const result = await updateRoutineItemAction(item.id, typeof title === "string" ? title : "");
    setIsSaving(false);
    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${item.title}"? This can't be undone.`)) return;
    setIsDeleting(true);
    const result = await deleteRoutineItemAction(item.id);
    setIsDeleting(false);
    if (result.status !== "success") setError(result.message ?? "Couldn't remove that item.");
  }

  if (isEditing) {
    return (
      <form action={handleRename} className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface p-3.5">
        <Input name="title" defaultValue={item.title} maxLength={120} required autoFocus className="flex-1" />
        <Button type="submit" size="sm" loading={isSaving}>
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line-subtle bg-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setIsEditing(true)} className="min-w-0 flex-1 text-left">
          <span className="truncate text-body-sm font-medium text-ink">{item.title}</span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => void moveRoutineItemAction(item.id, "up")}
            disabled={isFirst}
            aria-label={`Move "${item.title}" earlier`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronUp} size="sm" />
          </button>
          <button
            type="button"
            onClick={() => void moveRoutineItemAction(item.id, "down")}
            disabled={isLast}
            aria-label={`Move "${item.title}" later`}
            className={iconButtonClass}
          >
            <Icon icon={ChevronDown} size="sm" />
          </button>
          <button type="button" onClick={() => void handleDelete()} disabled={isDeleting} aria-label={`Remove "${item.title}"`} className={iconButtonClass}>
            <Icon icon={Trash2} size="sm" />
          </button>
        </div>
      </div>

      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}
    </div>
  );
}

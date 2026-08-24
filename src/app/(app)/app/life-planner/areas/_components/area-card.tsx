"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";

import { Alert, Button, Card, FormField, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifeArea } from "@/types/life-planner";

import { deleteLifeAreaAction, moveLifeAreaAction, updateLifeAreaAction } from "../actions";
import { AREA_COLOR_CHIP_CLASS, AREA_COLOR_OPTIONS, AREA_ICONS, AREA_ICON_OPTIONS } from "./area-visuals";

interface AreaCardProps {
  area: LifeArea;
  isFirst: boolean;
  isLast: boolean;
  /** How many of the user's goals are filed under this area (`getLifeGoalCountsByArea`, `@/lib/life-planner/life-goals`) - `0` for "none yet," never omitted. */
  goalCount: number;
}

/**
 * One Life Area card - view mode by default, an inline edit form in place
 * of the whole card when editing (the same "no separate route, no modal,
 * swap the card's own content" toggle `ActiveCategoryRow`
 * (`@/app/(app)/app/budget-planner/categories/_components/category-section.tsx`)
 * uses for renaming a budget category, extended here to the extra
 * description/icon/color fields a Life Area carries).
 *
 * The "activity" indicator this phase's spec called for (Prompt 2 Phase 1's
 * own comment on this component) is real as of Prompt 2 Phase 2: a plain
 * goal-count badge next to the icon chip, sourced from
 * `getLifeGoalCountsByArea` rather than a second per-area query.
 */
export function AreaCard({ area, isFirst, isLast, goalCount }: AreaCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const description = formData.get("description");
    const iconKey = formData.get("iconKey");
    const colorKey = formData.get("colorKey");

    setIsSaving(true);
    const result = await updateLifeAreaAction(area.id, {
      name: typeof name === "string" ? name : undefined,
      description: typeof description === "string" ? description : undefined,
      iconKey: typeof iconKey === "string" ? (iconKey as LifeArea["iconKey"]) : undefined,
      colorKey: typeof colorKey === "string" ? (colorKey as LifeArea["colorKey"]) : undefined,
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${area.name}"? This can't be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteLifeAreaAction(area.id);
    setIsDeleting(false);

    if (result.status !== "success") {
      setError(result.message ?? "Couldn't remove that area.");
    }
  }

  if (isEditing) {
    const AreaIcon = AREA_ICONS[area.iconKey];

    return (
      <Card variant="standard" padding="lg">
        <form action={handleSave} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${AREA_COLOR_CHIP_CLASS[area.colorKey]}`}>
              <Icon icon={AreaIcon} size="sm" />
            </div>
            <Text size="body-sm" tone="muted">
              Editing &ldquo;{area.name}&rdquo;
            </Text>
          </div>

          {error && (
            <Alert variant="error" title="Couldn't save that change">
              {error}
            </Alert>
          )}

          <FormField label="Name">
            <Input name="name" defaultValue={area.name} maxLength={60} required />
          </FormField>

          <FormField label="Description">
            <Textarea name="description" rows={2} maxLength={300} defaultValue={area.description ?? ""} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Icon">
              <Select name="iconKey" defaultValue={area.iconKey} options={AREA_ICON_OPTIONS} aria-label="Icon" />
            </FormField>
            <FormField label="Color">
              <Select name="colorKey" defaultValue={area.colorKey} options={AREA_COLOR_OPTIONS} aria-label="Color" />
            </FormField>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  const AreaIcon = AREA_ICONS[area.iconKey];

  return (
    <Card variant="standard" padding="lg" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${AREA_COLOR_CHIP_CLASS[area.colorKey]}`}>
            <Icon icon={AreaIcon} size="md" />
          </div>
          {goalCount > 0 && (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-caption font-medium text-ink-muted">
              {goalCount} {goalCount === 1 ? "goal" : "goals"}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void moveLifeAreaAction(area.id, "up")}
            disabled={isFirst}
            aria-label={`Move "${area.name}" earlier`}
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Icon icon={ChevronUp} size="sm" />
          </button>
          <button
            type="button"
            onClick={() => void moveLifeAreaAction(area.id, "down")}
            disabled={isLast}
            aria-label={`Move "${area.name}" later`}
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Icon icon={ChevronDown} size="sm" />
          </button>
        </div>
      </div>

      <div>
        <Text as="p" weight="semibold" className="text-ink">
          {area.name}
        </Text>
        <Text size="body-sm" tone="muted" className="mt-1">
          {area.description ?? "No description yet."}
        </Text>
      </div>

      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}

      <div className="mt-auto flex items-center gap-1 border-t border-line-subtle pt-3">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} loading={isDeleting}>
          <Trash2 className="size-4" aria-hidden="true" />
          Remove
        </Button>
      </div>
    </Card>
  );
}

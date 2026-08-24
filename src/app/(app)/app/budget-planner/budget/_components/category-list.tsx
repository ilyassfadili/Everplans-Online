"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Layers, Pencil, Trash2 } from "lucide-react";

import { Alert, Badge, Button, Card, EmptyState, Heading, Icon, Label, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/budget/currency";
import { getCategorySpendingStatus } from "@/lib/budget/budget";
import type { BudgetCategoryGroup, BudgetCategorySummary, CategorySpendingStatus } from "@/types/budget";

import { createCategoryFormAction, editCategoryAction, moveCategoryAction, removeCategoryAction, type CreateCategoryFormState } from "../actions";

const initialState: CreateCategoryFormState = { status: "idle" };

const SPENDING_STATUS_BADGE: Partial<Record<CategorySpendingStatus, { label: string; variant: "warning" | "error" }>> = {
  "approaching-limit": { label: "Near limit", variant: "warning" },
  "over-budget": { label: "Over budget", variant: "error" },
};

const GROUP_OPTIONS: { value: BudgetCategoryGroup; label: string }[] = [
  { value: "essentials", label: "Essentials" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "savings", label: "Savings" },
  { value: "goals", label: "Goals" },
  { value: "other", label: "Other" },
];

const GROUP_LABEL: Record<BudgetCategoryGroup, string> = {
  essentials: "Essentials",
  lifestyle: "Lifestyle",
  savings: "Savings",
  goals: "Goals",
  other: "Other",
};

// Fixed display order - not the order categories happen to be created in -
// so "what matters most" reads the same way for every plan (Prompt 2 Phase
// 4: "allow users to establish which areas matter most... without creating
// complicated automation"). Groups with no categories simply don't render.
const GROUP_ORDER: BudgetCategoryGroup[] = ["essentials", "lifestyle", "savings", "goals", "other"];

interface CategoryRowProps {
  planId: string;
  summary: BudgetCategorySummary;
  currency: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  /** `false` when this is the only category in its list - reordering controls have nothing to do, so they're left out entirely rather than shown disabled. */
  canReorder: boolean;
}

function CategoryRow({ planId, summary, currency, isFirstInGroup, isLastInGroup, canReorder }: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(Boolean(summary.category.notes));

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const plannedAmountCents = formData.get("plannedAmountCents");
    const group = formData.get("group");
    const notes = formData.get("notes");

    setIsSaving(true);
    const result = await editCategoryAction(summary.category.id, {
      name: typeof name === "string" ? name : undefined,
      plannedAmountCents: typeof plannedAmountCents === "string" ? plannedAmountCents : undefined,
      group: typeof group === "string" ? (group as BudgetCategoryGroup) : undefined,
      ...(showNote ? { notes: typeof notes === "string" ? notes : "" } : {}),
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleRemove() {
    if (window.confirm(`Remove the "${summary.category.name}" category? Its expenses will become uncategorized.`)) {
      void removeCategoryAction(summary.category.id);
    }
  }

  function handleMove(direction: "up" | "down") {
    void moveCategoryAction(planId, summary.category.id, direction);
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input name="name" defaultValue={summary.category.name} maxLength={100} aria-label="Category name" required />
            <Input
              name="plannedAmountCents"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(summary.category.plannedAmountCents / 100).toFixed(2)}
              aria-label="Planned amount"
              className="sm:w-32"
            />
            <Select name="group" defaultValue={summary.category.group} options={GROUP_OPTIONS} aria-label="Group" className="sm:w-36" />
          </div>
          {showNote ? (
            <Textarea name="notes" defaultValue={summary.category.notes ?? ""} placeholder="Optional context" rows={2} maxLength={500} aria-label="Note" />
          ) : (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="w-fit text-body-sm font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover"
            >
              + Add a note
            </button>
          )}
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  const spendingStatus = getCategorySpendingStatus(summary);
  const statusBadge = SPENDING_STATUS_BADGE[spendingStatus];

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Text size="body" weight="medium" className="text-ink">
            {summary.category.name}
          </Text>
          {statusBadge && (
            <Badge variant={statusBadge.variant}>
              {spendingStatus === "over-budget"
                ? `Over by ${formatCurrency(summary.actualCents - summary.category.plannedAmountCents, currency)}`
                : statusBadge.label}
            </Badge>
          )}
        </div>
        <Text size="body-sm" tone="muted" className="mt-1">
          {formatCurrency(summary.actualCents, currency)} of {formatCurrency(summary.category.plannedAmountCents, currency)} spent
        </Text>
        {summary.category.plannedAmountCents > 0 && (
          <div className="mt-2 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${spendingStatus === "over-budget" ? "bg-error" : spendingStatus === "approaching-limit" ? "bg-warning" : "bg-brand"}`}
              style={{ width: `${Math.min(100, Math.round((summary.actualCents / summary.category.plannedAmountCents) * 100))}%` }}
            />
          </div>
        )}
        {summary.category.notes && (
          <Text size="body-sm" tone="faint" className="mt-1.5">
            {summary.category.notes}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {canReorder && (
          <>
            <button
              type="button"
              onClick={() => handleMove("up")}
              disabled={isFirstInGroup}
              aria-label={`Move "${summary.category.name}" up`}
              className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <Icon icon={ChevronUp} size="sm" />
            </button>
            <button
              type="button"
              onClick={() => handleMove("down")}
              disabled={isLastInGroup}
              aria-label={`Move "${summary.category.name}" down`}
              className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <Icon icon={ChevronDown} size="sm" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${summary.category.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove "${summary.category.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

interface CategoryListProps {
  planId: string;
  categorySummaries: BudgetCategorySummary[];
  currency: string;
}

/**
 * Budget categories - planned/actual/remaining per category, each
 * editable/removable in place, plus a collapsible add-category form.
 *
 * Group headers (Essentials/Lifestyle/...) only appear once a plan
 * actually uses 2+ distinct groups - a brand-new plan with one or two
 * categories, all left at their "Other" default, gets a plain flat list
 * instead of a lone, jargon-y all-caps "OTHER" heading over content that
 * isn't organized by anything yet. The grouping feature reveals itself
 * once it's genuinely useful, not before.
 */
export function CategoryList({ planId, categorySummaries, currency }: CategoryListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showGroupField, setShowGroupField] = useState(false);
  const createAction = createCategoryFormAction.bind(null, planId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  const populatedGroups = GROUP_ORDER.filter((group) => categorySummaries.some((summary) => summary.category.group === group));
  const useGroupHeaders = populatedGroups.length > 1;

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Categories
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add category
          </Button>
        )}
      </div>

      {categorySummaries.length === 0 && !isAdding && (
        <EmptyState
          icon={Layers}
          title="Start mapping out your spending"
          description="Break your budget into categories like Housing, Groceries, or Entertainment to track spending against each one."
          className="mt-4 py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add your first category
            </Button>
          }
        />
      )}

      {categorySummaries.length > 0 &&
        (useGroupHeaders ? (
          <div className="mt-3 flex flex-col gap-5">
            {populatedGroups.map((group) => {
              const groupSummaries = categorySummaries.filter((summary) => summary.category.group === group);
              const groupPlanned = groupSummaries.reduce((sum, s) => sum + s.category.plannedAmountCents, 0);

              return (
                <div key={group}>
                  <div className="flex items-center justify-between gap-3">
                    <Text size="body-sm" weight="medium" tone="muted" className="uppercase tracking-wide">
                      {GROUP_LABEL[group]}
                    </Text>
                    <Text size="body-sm" tone="faint">
                      {formatCurrency(groupPlanned, currency)} planned
                    </Text>
                  </div>
                  <ul className="mt-1 flex flex-col divide-y divide-line-subtle">
                    {groupSummaries.map((summary, index) => (
                      <CategoryRow
                        key={summary.category.id}
                        planId={planId}
                        summary={summary}
                        currency={currency}
                        isFirstInGroup={index === 0}
                        isLastInGroup={index === groupSummaries.length - 1}
                        canReorder={groupSummaries.length > 1}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
            {categorySummaries.map((summary, index) => (
              <CategoryRow
                key={summary.category.id}
                planId={planId}
                summary={summary}
                currency={currency}
                isFirstInGroup={index === 0}
                isLastInGroup={index === categorySummaries.length - 1}
                canReorder={categorySummaries.length > 1}
              />
            ))}
          </ul>
        ))}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that category">
              {formState.message}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-category-name">Category name</Label>
              <Input id="new-category-name" name="name" placeholder="e.g. Groceries" maxLength={100} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-category-amount">Planned amount</Label>
              <Input id="new-category-amount" name="plannedAmountCents" type="number" step="0.01" min="0" className="sm:w-32" />
            </div>
          </div>
          {showGroupField ? (
            <div className="flex flex-col gap-1.5 sm:w-48">
              <Label htmlFor="new-category-group">Group</Label>
              <Select id="new-category-group" name="group" defaultValue="other" options={GROUP_OPTIONS} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowGroupField(true)}
              className="w-fit text-body-sm font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover"
            >
              + Organize into a group
            </button>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add category
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

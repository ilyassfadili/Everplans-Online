"use client";

import { useActionState, useState } from "react";
import { Layers, Pencil, Trash2 } from "lucide-react";

import { Alert, Badge, Button, Card, EmptyState, Heading, Icon, Label, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/wedding/currency";
import type { WeddingBudgetCategorySummary } from "@/types/wedding";

import { createCategoryFormAction, editCategoryAction, removeCategoryAction, type CreateCategoryFormState } from "../actions";

const initialState: CreateCategoryFormState = { status: "idle" };

interface CategoryRowProps {
  summary: WeddingBudgetCategorySummary;
  currency: string;
}

function CategoryRow({ summary, currency }: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const plannedAmountCents = formData.get("plannedAmountCents");

    setIsSaving(true);
    const result = await editCategoryAction(summary.category.id, {
      name: typeof name === "string" ? name : undefined,
      plannedAmountCents: typeof plannedAmountCents === "string" ? plannedAmountCents : undefined,
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
    if (window.confirm(`Remove the "${summary.category.name}" category? Its expenses will become uncategorized.`)) {
      void removeCategoryAction(summary.category.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input name="name" defaultValue={summary.category.name} maxLength={100} aria-label="Category name" required />
            <Input
              name="plannedAmountCents"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(summary.category.plannedAmountCents / 100).toFixed(2)}
              aria-label="Planned amount"
              className="sm:w-36"
            />
          </div>
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

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Text size="body" weight="medium" className="text-ink">
            {summary.category.name}
          </Text>
          {summary.isOverBudget && (
            <Badge variant="warning">Over by {formatCurrency(summary.actualCents - summary.category.plannedAmountCents, currency)}</Badge>
          )}
        </div>
        <Text size="body-sm" tone="muted" className="mt-1">
          {formatCurrency(summary.actualCents, currency)} of {formatCurrency(summary.category.plannedAmountCents, currency)} spent
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
          onClick={handleDelete}
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
  weddingId: string;
  categorySummaries: WeddingBudgetCategorySummary[];
  currency: string;
}

/** Budget categories - planned/actual/remaining per category (Phase 2), each editable/removable in place, plus a collapsible add-category form. */
export function CategoryList({ weddingId, categorySummaries, currency }: CategoryListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createCategoryFormAction.bind(null, weddingId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

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
          description="Break your budget into categories like Venue, Catering, or Photography to track spending against each one."
          className="mt-4 py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add your first category
            </Button>
          }
        />
      )}

      {categorySummaries.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {categorySummaries.map((summary) => (
            <CategoryRow key={summary.category.id} summary={summary} currency={currency} />
          ))}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn’t add that category">
              {formState.message}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-category-name">Category name</Label>
              <Input id="new-category-name" name="name" placeholder="e.g. Venue" maxLength={100} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-category-amount">Planned amount</Label>
              <Input id="new-category-amount" name="plannedAmountCents" type="number" step="0.01" min="0" className="sm:w-36" />
            </div>
          </div>
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

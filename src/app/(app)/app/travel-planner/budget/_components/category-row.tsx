"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/travel/currency";
import type { BudgetCategoryMutationResult, DeleteBudgetCategoryResult, UpdateBudgetCategoryInput } from "@/lib/travel/budget-categories";
import type { TripBudgetCategorySummary } from "@/types/travel";

interface CategoryRowProps {
  summary: TripBudgetCategorySummary;
  currency: string;
  onSave: (categoryId: string, input: UpdateBudgetCategoryInput) => Promise<BudgetCategoryMutationResult>;
  onDelete: (categoryId: string) => Promise<DeleteBudgetCategoryResult>;
}

/**
 * One budget category - name and planned amount, editable/deletable
 * inline. Once expenses exist against it (Phase 2), also shows actual
 * spending and what's left of *that category's* planned amount - "planned
 * vs. actual, per category" (Phase 2 §6), distinct from the overview
 * card's trip-wide planned/spent/remaining.
 */
export function CategoryRow({ summary, currency, onSave, onDelete }: CategoryRowProps) {
  const { category, actualCents, remainingCents, isOverBudget } = summary;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const name = formData.get("name");
    const plannedAmountCents = formData.get("plannedAmountCents");
    const result = await onSave(category.id, {
      name: typeof name === "string" ? name : undefined,
      plannedAmountCents: typeof plannedAmountCents === "string" ? plannedAmountCents : undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that category.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${category.name}" from your budget?`)) return;
    setIsDeleting(true);
    const result = await onDelete(category.id);
    if (result.status !== "success") {
      setIsDeleting(false);
      setError(result.message ?? "Couldn't remove that category.");
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
        <form action={handleSave} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input name="name" defaultValue={category.name} maxLength={100} aria-label="Category name" required />
          <Input
            name="plannedAmountCents"
            defaultValue={(category.plannedAmountCents / 100).toFixed(2)}
            inputMode="decimal"
            aria-label="Planned amount"
            className="sm:w-32"
          />
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
        {error && (
          <Text size="body-sm" tone="error">
            {error}
          </Text>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line-subtle bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Text size="body-sm" weight="medium" className="min-w-0 truncate text-ink">
          {category.name}
        </Text>
        <div className="flex shrink-0 items-center gap-3">
          <Text size="body-sm" weight="semibold" className="tabular-nums text-ink">
            {formatCurrency(category.plannedAmountCents, currency)}
          </Text>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit "${category.name}"`}
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Icon icon={Pencil} size="sm" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Remove "${category.name}"`}
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <Icon icon={Trash2} size="sm" />
          </button>
        </div>
      </div>
      {actualCents > 0 && (
        <div className="flex items-center gap-2">
          <Text size="body-sm" tone="muted">
            {formatCurrency(actualCents, currency)} spent
          </Text>
          <Badge variant={isOverBudget ? "warning" : "neutral"}>
            {isOverBudget ? `${formatCurrency(Math.abs(remainingCents), currency)} over` : `${formatCurrency(remainingCents, currency)} left`}
          </Badge>
        </div>
      )}
      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button, DatePicker, Icon, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/travel/currency";
import type { DeleteExpenseResult, ExpenseMutationResult, UpdateExpenseInput } from "@/lib/travel/expenses";
import type { TripBudgetCategory, TripExpense } from "@/types/travel";

interface ExpenseRowProps {
  expense: TripExpense;
  categories: TripBudgetCategory[];
  currency: string;
  onSave: (expenseId: string, input: UpdateExpenseInput) => Promise<ExpenseMutationResult>;
  onDelete: (expenseId: string) => Promise<DeleteExpenseResult>;
}

function formatExpenseDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** One expense - view/edit/delete inline, the same pattern every other row in this planner uses. */
export function ExpenseRow({ expense, categories, currency, onSave, onDelete }: ExpenseRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const title = formData.get("title");
    const amountCents = formData.get("amountCents");
    const expenseDate = formData.get("expenseDate");
    const categoryId = formData.get("categoryId");
    const notes = formData.get("notes");

    const result = await onSave(expense.id, {
      title: typeof title === "string" ? title : undefined,
      amountCents: typeof amountCents === "string" ? amountCents : undefined,
      expenseDate: typeof expenseDate === "string" ? expenseDate : undefined,
      categoryId: typeof categoryId === "string" ? categoryId : undefined,
      notes: typeof notes === "string" ? notes : undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that expense.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${expense.title}"?`)) return;
    setIsDeleting(true);
    const result = await onDelete(expense.id);
    if (result.status !== "success") {
      setIsDeleting(false);
      setError(result.message ?? "Couldn't remove that expense.");
    }
  }

  if (isEditing) {
    return (
      <li className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
        <form action={handleSave} className="grid gap-3 sm:grid-cols-2">
          <Input name="title" defaultValue={expense.title} maxLength={150} aria-label="Expense title" required />
          <Input name="amountCents" defaultValue={(expense.amountCents / 100).toFixed(2)} inputMode="decimal" aria-label="Amount" />
          <DatePicker name="expenseDate" defaultValue={expense.expenseDate} aria-label="Date" required />
          <Select
            name="categoryId"
            options={categoryOptions}
            defaultValue={expense.categoryId ?? undefined}
            placeholder="Uncategorized"
            aria-label="Category"
          />
          <Textarea name="notes" defaultValue={expense.notes ?? ""} maxLength={500} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" className="sm:col-span-2" />
          {error && (
            <Text size="body-sm" tone="error" className="sm:col-span-2">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3 sm:col-span-2">
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
        <Text size="body-sm" weight="medium" className="text-ink">
          {expense.title}
        </Text>
        <Text size="body-sm" tone="muted" className="mt-0.5">
          {formatExpenseDate(expense.expenseDate)}
        </Text>
        {expense.notes && (
          <Text size="body-sm" tone="muted" className="mt-1 whitespace-pre-wrap">
            {expense.notes}
          </Text>
        )}
        {error && (
          <Text size="body-sm" tone="error" className="mt-1">
            {error}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Text size="body-sm" weight="semibold" className="tabular-nums text-ink">
          {formatCurrency(expense.amountCents, currency)}
        </Text>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${expense.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Remove "${expense.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, DatePicker, FormField, Icon, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetAccount, BudgetCategory, BudgetIncomeEntry } from "@/types/budget";

import { editIncomeEntryAction, removeIncomeEntryAction } from "../actions";

function formatEntryDate(entryDate: string): string {
  const date = new Date(`${entryDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface IncomeEntryRowProps {
  entry: BudgetIncomeEntry;
  currency: string;
  categories: BudgetCategory[];
  accounts: BudgetAccount[];
  categoryName: string | null;
  accountName: string | null;
}

/** One row of actual income received - inline-editable/deletable, same interaction shape as Expenses' own `ExpenseRow`. */
export function IncomeEntryRow({ entry, currency, categories, accounts, categoryName, accountName }: IncomeEntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(Boolean(entry.note));

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));

  async function handleSave(formData: FormData) {
    const title = formData.get("title");
    const amountCents = formData.get("amountCents");
    const entryDate = formData.get("entryDate");
    const categoryId = formData.get("categoryId");
    const accountId = formData.get("accountId");
    const note = formData.get("note");

    setIsSaving(true);
    const result = await editIncomeEntryAction(entry.id, {
      title: typeof title === "string" ? title : undefined,
      amountCents: typeof amountCents === "string" ? amountCents : undefined,
      entryDate: typeof entryDate === "string" ? entryDate : undefined,
      categoryId: typeof categoryId === "string" ? categoryId : "",
      accountId: typeof accountId === "string" ? accountId : "",
      // Only included when the note field actually rendered -
      // `updateIncomeEntry` distinguishes "omitted" from "explicitly cleared"
      // via `Object.hasOwn` on this very object, so a collapsed note field
      // must never appear as a key here at all, not just as an empty value.
      ...(showNote ? { note: typeof note === "string" ? note : "" } : {}),
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
    if (window.confirm(`Remove "${entry.title}"?`)) {
      void removeIncomeEntryAction(entry.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <FormField label="Source" required>
            <Input name="title" defaultValue={entry.title} maxLength={150} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Amount" required>
              <Input
                name="amountCents"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue={(entry.amountCents / 100).toFixed(2)}
              />
            </FormField>
            <FormField label="Date" required>
              <DatePicker name="entryDate" defaultValue={entry.entryDate} />
            </FormField>
            {categoryOptions.length > 0 && (
              <FormField label="Category">
                <Select
                  name="categoryId"
                  defaultValue={entry.categoryId ?? undefined}
                  placeholder="Uncategorized"
                  options={categoryOptions}
                />
              </FormField>
            )}
          </div>
          {accountOptions.length > 0 && (
            <FormField label="Account">
              <Select name="accountId" defaultValue={entry.accountId ?? undefined} placeholder="No account" options={accountOptions} />
            </FormField>
          )}
          {showNote ? (
            <FormField label="Note">
              <Textarea name="note" defaultValue={entry.note ?? ""} placeholder="Optional context" rows={2} maxLength={500} />
            </FormField>
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

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <Text size="body" weight="medium" className="text-ink">
          {entry.title}
        </Text>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Text size="body-sm" tone="muted">
            {formatEntryDate(entry.entryDate)}
          </Text>
          {categoryName && <Badge variant="neutral">{categoryName}</Badge>}
          {accountName && <Badge variant="neutral">{accountName}</Badge>}
        </div>
        {entry.note && (
          <Text size="body-sm" tone="faint" className="mt-1">
            {entry.note}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Text size="body" weight="medium" className="text-ink">
          {formatCurrency(entry.amountCents, currency)}
        </Text>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${entry.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove "${entry.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

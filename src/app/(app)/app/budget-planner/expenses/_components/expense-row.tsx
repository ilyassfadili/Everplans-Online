"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, DatePicker, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetAccount, BudgetCategory, BudgetExpense } from "@/types/budget";

import { editExpenseAction, removeExpenseAction } from "../actions";

function formatExpenseDate(expenseDate: string): string {
  const date = new Date(`${expenseDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ExpenseRowProps {
  expense: BudgetExpense;
  currency: string;
  categories: BudgetCategory[];
  categoryName: string | null;
  accounts: BudgetAccount[];
  accountName: string | null;
}

export function ExpenseRow({ expense, currency, categories, categoryName, accounts, accountName }: ExpenseRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));

  async function handleSave(formData: FormData) {
    const title = formData.get("title");
    const amountCents = formData.get("amountCents");
    const expenseDate = formData.get("expenseDate");
    const categoryId = formData.get("categoryId");
    const accountId = formData.get("accountId");

    setIsSaving(true);
    const result = await editExpenseAction(expense.id, {
      title: typeof title === "string" ? title : undefined,
      amountCents: typeof amountCents === "string" ? amountCents : undefined,
      expenseDate: typeof expenseDate === "string" ? expenseDate : undefined,
      categoryId: typeof categoryId === "string" ? categoryId : "",
      accountId: typeof accountId === "string" ? accountId : "",
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
    if (window.confirm(`Remove "${expense.title}"?`)) {
      void removeExpenseAction(expense.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <Input name="title" defaultValue={expense.title} maxLength={150} aria-label="What was it?" required />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="amountCents" type="number" step="0.01" min="0" defaultValue={(expense.amountCents / 100).toFixed(2)} aria-label="Amount" required />
            <DatePicker name="expenseDate" defaultValue={expense.expenseDate} aria-label="Date" required />
            {categoryOptions.length > 0 && (
              <Select name="categoryId" defaultValue={expense.categoryId ?? undefined} placeholder="Uncategorized" options={categoryOptions} aria-label="Category" />
            )}
            {accountOptions.length > 0 && (
              <Select name="accountId" defaultValue={expense.accountId ?? undefined} placeholder="No account" options={accountOptions} aria-label="Account" />
            )}
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
        <Text size="body" weight="medium" className="text-ink">
          {expense.title}
        </Text>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Text size="body-sm" tone="muted">
            {formatExpenseDate(expense.expenseDate)}
          </Text>
          {categoryName && <Badge variant="neutral">{categoryName}</Badge>}
          {accountName && <Badge variant="outline">{accountName}</Badge>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Text size="body" weight="medium" className="text-ink">
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
          onClick={handleRemove}
          aria-label={`Remove "${expense.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

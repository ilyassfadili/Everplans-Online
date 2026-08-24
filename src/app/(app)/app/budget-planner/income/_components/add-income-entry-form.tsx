"use client";

import { useActionState, useState } from "react";

import { Alert, Button, DatePicker, FormField, Select, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { isCurrentMonth, type MonthKey } from "@/lib/budget/month";
import type { BudgetAccount, BudgetCategory } from "@/types/budget";

import { createIncomeEntryFormAction, type CreateIncomeEntryFormState } from "../actions";

const initialState: CreateIncomeEntryFormState = { status: "idle" };

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * The date a fresh add-income form should start on - today when the visitor
 * is looking at the current month (the common case), otherwise the first of
 * whatever month they're currently viewing, so logging income while browsing
 * a past/future month doesn't default to a date outside it. Either way it's
 * only a starting point - `DatePicker` lets it be changed freely.
 */
function getDefaultEntryDate(month: MonthKey): string {
  return isCurrentMonth(month) ? todayIsoDate() : `${month}-01`;
}

interface AddIncomeEntryFormProps {
  planId: string;
  month: MonthKey;
  categories: BudgetCategory[];
  accounts: BudgetAccount[];
  onCancel: () => void;
}

/** The Income page's "Income received" quick-add form - amount, source, date, plus optional category/account/note. Collapsible: the parent list mounts this only while adding. */
export function AddIncomeEntryForm({ planId, month, categories, accounts, onCancel }: AddIncomeEntryFormProps) {
  const [showNote, setShowNote] = useState(false);
  const action = createIncomeEntryFormAction.bind(null, planId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn't add that income">
          {state.message}
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Source" required className="sm:col-span-2 lg:col-span-1">
          <Input name="title" placeholder="e.g. Paycheck" maxLength={150} />
        </FormField>
        <FormField label="Amount" required>
          <Input name="amountCents" type="number" inputMode="decimal" step="0.01" min="0" />
        </FormField>
        <FormField label="Date" required>
          <DatePicker name="entryDate" defaultValue={getDefaultEntryDate(month)} />
        </FormField>
        {categoryOptions.length > 0 && (
          <FormField label="Category">
            <Select name="categoryId" placeholder="Uncategorized" options={categoryOptions} />
          </FormField>
        )}
      </div>
      {accountOptions.length > 0 && (
        <FormField label="Account" hint="Optional - which account this landed in.">
          <Select name="accountId" placeholder="No account" options={accountOptions} />
        </FormField>
      )}
      {showNote ? (
        <FormField label="Note" hint="Optional context.">
          <Textarea name="note" placeholder="Optional context" rows={2} maxLength={500} />
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
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={isCreating}>
          Add income
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

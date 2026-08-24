"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { Badge, Button, DatePicker, Icon, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetAccount, BudgetCategory, BudgetTransaction } from "@/types/budget";

import { editTransactionAction, removeTransactionAction } from "../actions";

function formatTransactionDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface TransactionRowProps {
  transaction: BudgetTransaction;
  currency: string;
  categoryName: string | null;
  accountName: string | null;
  /** Every category (both kinds) - narrowed to this row's own `kind` for the edit picker, same "never let an expense point at an income category" boundary `AddExpenseForm` enforces at creation time. */
  categories: BudgetCategory[];
  accounts: BudgetAccount[];
}

/**
 * One Transactions row (Everplans Money Prompt 2 Phase 4) - editable/
 * deletable in place, the same expand-in-place pattern `ExpenseRow` and
 * `IncomeRow` each already use, unified here to branch on the row's own
 * `transaction.type` and dispatch to whichever real mutation
 * (`editTransactionAction`/`removeTransactionAction`, `@/app/(app)/app/
 * budget-planner/transactions/actions.ts`) actually owns it.
 */
export function TransactionRow({ transaction, currency, categoryName, accountName, categories, accounts }: TransactionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIncome = transaction.type === "income";
  const categoryOptions = categories.filter((category) => category.kind === transaction.type).map((category) => ({ value: category.id, label: category.name }));
  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));

  async function handleSave(formData: FormData) {
    const title = formData.get("title");
    const amountCents = formData.get("amountCents");
    const date = formData.get("date");
    const categoryId = formData.get("categoryId");
    const accountId = formData.get("accountId");

    setIsSaving(true);
    const result = await editTransactionAction(transaction.id, transaction.type, {
      title: typeof title === "string" ? title : undefined,
      amountCents: typeof amountCents === "string" ? amountCents : undefined,
      date: typeof date === "string" ? date : undefined,
      // Only included when the picker actually rendered (`categoryOptions`/
      // `accountOptions` non-empty) - always as a string (possibly the
      // "Uncategorized"/"No account" placeholder's empty value), the same
      // "leave alone vs. explicitly clear" convention `ExpenseRow` uses,
      // since `Object.hasOwn` downstream can't otherwise tell "not rendered"
      // from "rendered but cleared".
      ...(categoryOptions.length > 0 ? { categoryId: typeof categoryId === "string" ? categoryId : "" } : {}),
      ...(accountOptions.length > 0 ? { accountId: typeof accountId === "string" ? accountId : "" } : {}),
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
    if (window.confirm(`Remove "${transaction.title}"?`)) {
      void removeTransactionAction(transaction.id, transaction.type);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <Input name="title" defaultValue={transaction.title} maxLength={150} aria-label="Title" required />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="amountCents" type="number" step="0.01" min="0" defaultValue={(transaction.amountCents / 100).toFixed(2)} aria-label="Amount" required />
            <DatePicker name="date" defaultValue={transaction.date} aria-label="Date" required />
            {categoryOptions.length > 0 && (
              <Select name="categoryId" defaultValue={transaction.categoryId ?? undefined} placeholder="Uncategorized" options={categoryOptions} aria-label="Category" />
            )}
            {accountOptions.length > 0 && (
              <Select name="accountId" defaultValue={transaction.accountId ?? undefined} placeholder="No account" options={accountOptions} aria-label="Account" />
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
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Badge variant={isIncome ? "success" : "error"} className="mt-0.5 shrink-0">
          <Icon icon={isIncome ? ArrowDownLeft : ArrowUpRight} size="sm" />
          {isIncome ? "Income" : "Expense"}
        </Badge>
        <div className="min-w-0">
          <Text size="body" weight="medium" className="text-ink">
            {transaction.title}
          </Text>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-body-sm text-ink-muted">
            <span>{formatTransactionDate(transaction.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{categoryName ?? "Uncategorized"}</span>
            {accountName && (
              <>
                <span aria-hidden="true">·</span>
                <span>{accountName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <Text size="body" weight="medium" tone={isIncome ? "success" : "error"}>
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amountCents, currency)}
        </Text>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit "${transaction.title}"`}
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Icon icon={Pencil} size="sm" />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={`Remove "${transaction.title}"`}
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Icon icon={Trash2} size="sm" />
          </button>
        </div>
      </div>
    </li>
  );
}

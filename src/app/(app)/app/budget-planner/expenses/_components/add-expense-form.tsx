"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { BudgetAccount, BudgetCategory } from "@/types/budget";

import { createExpenseFormAction, type CreateExpenseFormState } from "../actions";

const initialState: CreateExpenseFormState = { status: "idle" };

interface AddExpenseFormProps {
  planId: string;
  categories: BudgetCategory[];
  accounts: BudgetAccount[];
}

/** The Expenses page's quick-add row - what was it / how much / when / which category, the same four essential fields `wedding-planner/budget`'s own `AddExpenseForm` establishes. */
export function AddExpenseForm({ planId, categories, accounts }: AddExpenseFormProps) {
  const action = createExpenseFormAction.bind(null, planId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn't add that expense" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="new-expense-title">What was it?</Label>
          <Input id="new-expense-title" name="title" placeholder="e.g. Groceries" maxLength={150} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-expense-amount">Amount</Label>
          <Input id="new-expense-amount" name="amountCents" type="number" step="0.01" min="0" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-expense-date">Date</Label>
          <DatePicker id="new-expense-date" name="expenseDate" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-expense-category">Category</Label>
          {categoryOptions.length > 0 ? (
            <Select id="new-expense-category" name="categoryId" placeholder="Uncategorized" options={categoryOptions} />
          ) : (
            <Input value="Add a category first" disabled readOnly />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-expense-account">Account</Label>
          {accountOptions.length > 0 ? (
            <Select id="new-expense-account" name="accountId" placeholder="No account" options={accountOptions} />
          ) : (
            <Input value="Add an account first" disabled readOnly />
          )}
        </div>

        <Button type="submit" loading={isCreating} className="self-end sm:col-span-2 sm:w-auto sm:justify-self-start lg:col-span-1">
          Add expense
        </Button>
      </form>
    </Card>
  );
}

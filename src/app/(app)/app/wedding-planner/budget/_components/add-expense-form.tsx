"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { WeddingBudgetCategory, WeddingVendor } from "@/types/wedding";

import { createExpenseFormAction, type CreateExpenseFormState } from "../actions";

const initialState: CreateExpenseFormState = { status: "idle" };

interface AddExpenseFormProps {
  weddingId: string;
  categories: WeddingBudgetCategory[];
  vendors: WeddingVendor[];
}

/**
 * The budget's quick-add row - "what was it / how much / when / which
 * category" (Phase 3's own four essential fields), plus an optional
 * vendor. The vendor field is a plain text input backed by a `<datalist>`
 * of previously-used names (native browser autocomplete, no combobox
 * component needed) - typing an existing name links to that vendor,
 * typing a new one creates it (`findOrCreateVendorByName`, resolved
 * server-side in the Server Action, not here).
 */
export function AddExpenseForm({ weddingId, categories, vendors }: AddExpenseFormProps) {
  const action = createExpenseFormAction.bind(null, weddingId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that expense" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="new-expense-title">What was it?</Label>
          <Input id="new-expense-title" name="title" placeholder="e.g. Venue deposit" maxLength={150} required />
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

        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="new-expense-vendor">
            Vendor <span className="font-normal text-ink-faint">(optional)</span>
          </Label>
          <Input id="new-expense-vendor" name="vendorName" list="wedding-vendor-options" placeholder="e.g. Riverside Barn" maxLength={150} />
          <datalist id="wedding-vendor-options">
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.name} />
            ))}
          </datalist>
        </div>

        <Button type="submit" loading={isCreating} className="self-end sm:col-span-2 sm:w-auto sm:justify-self-start lg:col-span-1">
          Add expense
        </Button>
      </form>
    </Card>
  );
}

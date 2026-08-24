"use client";

import { useActionState, useState } from "react";

import { Alert, Button, Card, Heading, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { BudgetCategoryKind } from "@/types/budget";

import { createCategoryFormAction, type CreateCategoryFormState } from "../actions";

const initialState: CreateCategoryFormState = { status: "idle" };

const KIND_OPTIONS: { value: BudgetCategoryKind; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

interface AddCategoryFormProps {
  planId: string;
}

/**
 * The Categories page's single add form (Everplans Money Prompt 2) - name +
 * kind only. Deliberately no planned-amount or group field: those stay
 * exclusive to the Budget page's own category form, which is the one place
 * that concern (budget allocation) belongs. `createCategory` defaults
 * `plannedAmountCents`/`group` on its own when they're omitted here.
 */
export function AddCategoryForm({ planId }: AddCategoryFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createCategoryFormAction.bind(null, planId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Add a category
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add category
          </Button>
        )}
      </div>

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
              <Input id="new-category-name" name="name" placeholder="e.g. Freelance income" maxLength={100} required />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-40">
              <Label htmlFor="new-category-kind">Type</Label>
              <Select id="new-category-kind" name="kind" defaultValue="expense" options={KIND_OPTIONS} />
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

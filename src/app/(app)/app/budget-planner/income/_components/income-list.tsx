"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, Wallet } from "lucide-react";

import { Alert, Badge, Button, Card, EmptyState, Heading, Icon, Label, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetIncomeFrequency, BudgetIncomeSource } from "@/types/budget";

import {
  createIncomeSourceFormAction,
  editIncomeSourceAction,
  removeIncomeSourceAction,
  toggleIncomeSourceActiveAction,
  type CreateIncomeSourceFormState,
} from "../actions";

const initialState: CreateIncomeSourceFormState = { status: "idle" };

const FREQUENCY_OPTIONS: { value: BudgetIncomeFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-time", label: "One-time" },
];

const FREQUENCY_LABEL: Record<BudgetIncomeFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  yearly: "Yearly",
  "one-time": "One-time",
};

interface IncomeRowProps {
  source: BudgetIncomeSource;
  currency: string;
}

function IncomeRow({ source, currency }: IncomeRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(Boolean(source.notes));

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const amountCents = formData.get("amountCents");
    const frequency = formData.get("frequency");
    const notes = formData.get("notes");

    setIsSaving(true);
    const result = await editIncomeSourceAction(source.id, {
      name: typeof name === "string" ? name : undefined,
      amountCents: typeof amountCents === "string" ? amountCents : undefined,
      frequency: typeof frequency === "string" ? (frequency as BudgetIncomeFrequency) : undefined,
      // Only included when the note field actually rendered - `updateIncomeSource`
      // distinguishes "omitted" from "explicitly cleared" via `Object.hasOwn`
      // on this very object, so a collapsed note field must never appear as
      // a key here at all, not just as an empty value.
      ...(showNote ? { notes: typeof notes === "string" ? notes : "" } : {}),
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
    if (window.confirm(`Remove "${source.name}"?`)) {
      void removeIncomeSourceAction(source.id);
    }
  }

  function handleToggleActive() {
    void toggleIncomeSourceActiveAction(source.id, !source.isActive);
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input name="name" defaultValue={source.name} maxLength={100} aria-label="Income name" required />
            <Input
              name="amountCents"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(source.amountCents / 100).toFixed(2)}
              aria-label="Amount"
              className="sm:w-32"
              required
            />
            <Select name="frequency" defaultValue={source.frequency} options={FREQUENCY_OPTIONS} aria-label="Frequency" className="sm:w-40" />
          </div>
          {showNote ? (
            <Textarea name="notes" defaultValue={source.notes ?? ""} placeholder="Optional context" rows={2} aria-label="Note" maxLength={500} />
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
        <div className="flex flex-wrap items-center gap-2">
          <Text size="body" weight="medium" className={source.isActive ? "text-ink" : "text-ink-faint line-through"}>
            {source.name}
          </Text>
          {!source.isActive && <Badge variant="neutral">Inactive</Badge>}
        </div>
        <Text size="body-sm" tone="muted" className="mt-1">
          {formatCurrency(source.amountCents, currency)} · {FREQUENCY_LABEL[source.frequency]}
        </Text>
        {source.notes && (
          <Text size="body-sm" tone="faint" className="mt-1">
            {source.notes}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleToggleActive}
          className="rounded-full px-2.5 py-1 text-caption font-medium text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
        >
          {source.isActive ? "Deactivate" : "Reactivate"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${source.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove "${source.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

interface IncomeListProps {
  planId: string;
  incomeSources: BudgetIncomeSource[];
  currency: string;
}

/** Income sources - each editable/removable/deactivatable in place, plus a collapsible add form. Not hard-coded types: name is whatever the user types. */
export function IncomeList({ planId, incomeSources, currency }: IncomeListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const createAction = createIncomeSourceFormAction.bind(null, planId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Income sources
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add income
          </Button>
        )}
      </div>

      {incomeSources.length === 0 && !isAdding && (
        <EmptyState
          icon={Wallet}
          title="Add what you expect to earn"
          description="Salary, freelance work, anything recurring or one-off - add each source on whatever schedule it actually follows."
          className="mt-4 py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add your first income source
            </Button>
          }
        />
      )}

      {incomeSources.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {incomeSources.map((source) => (
            <IncomeRow key={source.id} source={source} currency={currency} />
          ))}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that income source">
              {formState.message}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-income-name">Name</Label>
              <Input id="new-income-name" name="name" placeholder="e.g. Salary" maxLength={100} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-income-amount">Amount</Label>
              <Input id="new-income-amount" name="amountCents" type="number" step="0.01" min="0" className="sm:w-32" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-income-frequency">Frequency</Label>
              <Select id="new-income-frequency" name="frequency" defaultValue="monthly" options={FREQUENCY_OPTIONS} className="sm:w-40" />
            </div>
          </div>
          {showNewNote ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-income-notes">
                Note <span className="font-normal text-ink-faint">(optional)</span>
              </Label>
              <Textarea id="new-income-notes" name="notes" placeholder="Optional context" rows={2} maxLength={500} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewNote(true)}
              className="w-fit text-body-sm font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover"
            >
              + Add a note
            </button>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add income
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

"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Repeat, Trash2 } from "lucide-react";

import { Alert, Badge, Button, Card, DatePicker, EmptyState, Heading, Icon, Label, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { formatCurrency } from "@/lib/budget/currency";
import { getCurrentNextOccurrence } from "@/lib/budget/recurring-occurrence";
import type { BudgetCategory, BudgetRecurringFrequency, BudgetRecurringItem, BudgetRecurringItemType } from "@/types/budget";

import {
  createRecurringItemFormAction,
  editRecurringItemAction,
  removeRecurringItemAction,
  toggleRecurringItemActiveAction,
  type CreateRecurringItemFormState,
} from "../actions";

const initialState: CreateRecurringItemFormState = { status: "idle" };

const TYPE_OPTIONS: { value: BudgetRecurringItemType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense / bill" },
  { value: "savings", label: "Savings contribution" },
];

const TYPE_LABEL: Record<BudgetRecurringItemType, string> = {
  income: "Income",
  expense: "Expense",
  savings: "Savings",
};

const FREQUENCY_OPTIONS: { value: BudgetRecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const FREQUENCY_LABEL: Record<BudgetRecurringFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface RecurringRowProps {
  item: BudgetRecurringItem;
  currency: string;
  categories: BudgetCategory[];
}

function RecurringRow({ item, currency, categories }: RecurringRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = item.categoryId ? categories.find((c) => c.id === item.categoryId) : null;
  const nextOccurrence = getCurrentNextOccurrence(item);
  const currentItem = { startDate: item.startDate, frequency: item.frequency, endDate: item.endDate };

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const amountCents = formData.get("amountCents");
    const frequency = formData.get("frequency");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const categoryId = formData.get("categoryId");
    const notes = formData.get("notes");

    setIsSaving(true);
    const result = await editRecurringItemAction(item.id, currentItem, {
      name: typeof name === "string" ? name : undefined,
      amountCents: typeof amountCents === "string" ? amountCents : undefined,
      frequency: typeof frequency === "string" ? (frequency as BudgetRecurringFrequency) : undefined,
      startDate: typeof startDate === "string" ? startDate : undefined,
      endDate: typeof endDate === "string" ? endDate : "",
      categoryId: item.type === "expense" ? (typeof categoryId === "string" ? categoryId : "") : undefined,
      notes: typeof notes === "string" ? notes : "",
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
    if (window.confirm(`Remove "${item.name}"?`)) {
      void removeRecurringItemAction(item.id);
    }
  }

  function handleTogglePause() {
    void toggleRecurringItemActiveAction(item.id, currentItem, !item.isActive);
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input name="name" defaultValue={item.name} maxLength={150} aria-label="Name" required />
            <Input
              name="amountCents"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(item.amountCents / 100).toFixed(2)}
              aria-label="Amount"
              className="sm:w-32"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select name="frequency" defaultValue={item.frequency} options={FREQUENCY_OPTIONS} aria-label="Frequency" />
            <DatePicker name="startDate" defaultValue={item.startDate} aria-label="Start date" required />
            <DatePicker name="endDate" defaultValue={item.endDate ?? ""} aria-label="End date (optional)" placeholder="No end date" />
          </div>
          {item.type === "expense" && categoryOptions.length > 0 && (
            <Select name="categoryId" defaultValue={item.categoryId ?? undefined} placeholder="Uncategorized" options={categoryOptions} aria-label="Category" />
          )}
          <Textarea name="notes" defaultValue={item.notes ?? ""} placeholder="Notes (optional)" rows={2} maxLength={500} aria-label="Notes" />
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
          <Text size="body" weight="medium" className={item.isActive ? "text-ink" : "text-ink-faint line-through"}>
            {item.name}
          </Text>
          {category && <Badge variant="neutral">{category.name}</Badge>}
          {!item.isActive && <Badge variant="neutral">Paused</Badge>}
        </div>
        <Text size="body-sm" tone="muted" className="mt-1">
          {formatCurrency(item.amountCents, currency)} · {FREQUENCY_LABEL[item.frequency]}
          {item.isActive && nextOccurrence && ` · Next: ${formatDate(nextOccurrence)}`}
          {!item.isActive && " · No upcoming occurrences while paused"}
        </Text>
        {item.notes && (
          <Text size="body-sm" tone="faint" className="mt-1">
            {item.notes}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleTogglePause}
          className="rounded-full px-2.5 py-1 text-caption font-medium text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
        >
          {item.isActive ? "Pause" : "Reactivate"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${item.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove "${item.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

const TYPE_ORDER: BudgetRecurringItemType[] = ["income", "expense", "savings"];

interface RecurringListProps {
  planId: string;
  recurringItems: BudgetRecurringItem[];
  categories: BudgetCategory[];
  currency: string;
}

/**
 * Recurring items management (Prompt 4 Phase 1) - grouped by type
 * (income/expense/savings) once a plan actually has 2+ types in use, the
 * same "don't show grouping chrome over a single group" rule the Budget
 * page's `CategoryList` applies - a new user's first couple of recurring
 * items (usually all bills) get a plain flat list, not a lone all-caps
 * "EXPENSE" heading over content nothing is actually grouped against yet.
 * Progressive disclosure on add: end date and notes stay behind a toggle,
 * category only appears once "Expense" is chosen - most recurring items
 * never need any of those.
 */
export function RecurringList({ planId, recurringItems, categories, currency }: RecurringListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [type, setType] = useState<BudgetRecurringItemType>("expense");
  const createAction = createRecurringItemFormAction.bind(null, planId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const populatedTypes = TYPE_ORDER.filter((groupType) => recurringItems.some((item) => item.type === groupType));
  const useTypeHeaders = populatedTypes.length > 1;

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Recurring items
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)} leadingIcon={<Icon icon={Plus} size="sm" />}>
            Add recurring item
          </Button>
        )}
      </div>

      {recurringItems.length === 0 && !isAdding && (
        <EmptyState
          icon={Repeat}
          title="Represent what repeats"
          description="Rent, a subscription, your paycheck, a recurring savings contribution - add anything that happens on a schedule so it shows up on your Upcoming timeline automatically."
          className="mt-4 py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add your first recurring item
            </Button>
          }
        />
      )}

      {recurringItems.length > 0 &&
        (useTypeHeaders ? (
          <div className="mt-3 flex flex-col gap-5">
            {populatedTypes.map((groupType) => {
              const groupItems = recurringItems.filter((item) => item.type === groupType);

              return (
                <div key={groupType}>
                  <Text size="body-sm" weight="medium" tone="muted" className="uppercase tracking-wide">
                    {TYPE_LABEL[groupType]}
                  </Text>
                  <ul className="mt-1 flex flex-col divide-y divide-line-subtle">
                    {groupItems.map((item) => (
                      <RecurringRow key={item.id} item={item} currency={currency} categories={categories} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
            {recurringItems.map((item) => (
              <RecurringRow key={item.id} item={item} currency={currency} categories={categories} />
            ))}
          </ul>
        ))}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that recurring item">
              {formState.message}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-recurring-type">Type</Label>
              <Select
                id="new-recurring-type"
                name="type"
                defaultValue="expense"
                options={TYPE_OPTIONS}
                onValueChange={(value) => setType(value as BudgetRecurringItemType)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="new-recurring-name">Name</Label>
              <Input id="new-recurring-name" name="name" placeholder="e.g. Rent" maxLength={150} required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-recurring-amount">Amount</Label>
              <Input id="new-recurring-amount" name="amountCents" type="number" step="0.01" min="0" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-recurring-frequency">Frequency</Label>
              <Select id="new-recurring-frequency" name="frequency" defaultValue="monthly" options={FREQUENCY_OPTIONS} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-recurring-start">Start date</Label>
              <DatePicker id="new-recurring-start" name="startDate" required />
            </div>
          </div>

          {type === "expense" && categoryOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-recurring-category">Category</Label>
              <Select id="new-recurring-category" name="categoryId" placeholder="Uncategorized" options={categoryOptions} />
            </div>
          )}

          {showMore ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-recurring-end">
                  End date <span className="font-normal text-ink-faint">(optional)</span>
                </Label>
                <DatePicker id="new-recurring-end" name="endDate" placeholder="No end date" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-recurring-notes">
                  Notes <span className="font-normal text-ink-faint">(optional)</span>
                </Label>
                <Textarea id="new-recurring-notes" name="notes" rows={1} maxLength={500} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="w-fit text-body-sm font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover"
            >
              + More options
            </button>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add recurring item
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

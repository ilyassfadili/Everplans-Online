"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeftRight } from "lucide-react";

import { Button, Icon, Label, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/budget/currency";
import type { BudgetCategory } from "@/types/budget";

import { reallocateCategoriesAction } from "../actions";

interface ReallocateFormProps {
  categories: BudgetCategory[];
  currency: string;
}

/**
 * "Move money between categories" (Prompt 5 Phase 4) - collapsed behind a
 * button, since most visits to the Budget page aren't a reallocation.
 * Deliberately just two categories and an amount, not a full multi-way
 * rebalancing tool - the system itself guarantees the total planned stays
 * identical (`reallocateBetweenCategories` moves the same amount off one
 * category and onto another, never inventing or losing any of it).
 */
export function ReallocateForm({ categories, currency }: ReallocateFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fromCategoryId, setFromCategoryId] = useState("");
  const [toCategoryId, setToCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (categories.length < 2) {
    return null;
  }

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const fromCategory = categories.find((category) => category.id === fromCategoryId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    const result = await reallocateCategoriesAction({ fromCategoryId, toCategoryId, amountCents: amount });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setSuccess(true);
      setAmount("");
    } else {
      setError(result.message);
    }
  }

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} leadingIcon={<Icon icon={ArrowLeftRight} size="sm" />} className="w-fit">
        Move money between categories
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-line-subtle bg-surface p-4">
      <Text weight="medium" className="text-ink">
        Move money between categories
      </Text>
      {success && (
        <Text size="body-sm" tone="success" className="mt-1">
          Moved. Your total planned budget is unchanged.
        </Text>
      )}
      <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reallocate-from">From</Label>
          <Select id="reallocate-from" placeholder="Category" value={fromCategoryId} onValueChange={setFromCategoryId} options={categoryOptions} />
          {fromCategory && (
            <Text size="caption" tone="faint">
              {formatCurrency(fromCategory.plannedAmountCents, currency)} planned
            </Text>
          )}
        </div>
        <div className="hidden items-end justify-center pb-2.5 sm:flex">
          <Icon icon={ArrowLeftRight} size="sm" className="text-ink-faint" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reallocate-to">To</Label>
          <Select id="reallocate-to" placeholder="Category" value={toCategoryId} onValueChange={setToCategoryId} options={categoryOptions} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reallocate-amount">Amount</Label>
          <Input id="reallocate-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" className="sm:w-28" />
        </div>
        {error && (
          <Text size="body-sm" tone="error" className="sm:col-span-4">
            {error}
          </Text>
        )}
        <div className="flex items-center gap-3 sm:col-span-4">
          <Button type="submit" size="sm" loading={isSaving}>
            Move
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </form>
    </div>
  );
}

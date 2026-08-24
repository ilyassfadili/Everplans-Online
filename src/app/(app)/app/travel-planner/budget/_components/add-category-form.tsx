"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Badge, Button, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { BudgetCategoryMutationResult, CreateBudgetCategoryInput } from "@/lib/travel/budget-categories";

interface AddCategoryFormProps {
  existingNames: string[];
  onAdd: (input: CreateBudgetCategoryInput) => Promise<BudgetCategoryMutationResult>;
}

// Prompt 3 Phase 1 §4's own "at minimum" list - a starting point, not a
// closed set (the underlying field is free text, `@/lib/travel/budget`'s
// own comment). Clicking one creates the category immediately at $0
// planned, ready to have an amount set - faster than opening the full form
// for the common case of just wanting these categories to exist.
const SUGGESTED_CATEGORIES = ["Transportation", "Accommodation", "Food", "Activities", "Shopping", "Other"];

/** Quick-add suggestions plus a custom "add category" form - collapsed by default, the same "don't open every form at once" restraint `AddActivityForm` already establishes. */
export function AddCategoryForm({ existingNames, onAdd }: AddCategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existingLower = new Set(existingNames.map((name) => name.toLowerCase()));
  const suggestions = SUGGESTED_CATEGORIES.filter((name) => !existingLower.has(name.toLowerCase()));

  async function handleAddSuggestion(name: string) {
    setPendingSuggestion(name);
    setError(null);
    const result = await onAdd({ name, plannedAmountCents: "0" });
    setPendingSuggestion(null);
    if (result.status !== "success") {
      setError(result.message ?? "Couldn't add that category.");
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const name = formData.get("name");
    const plannedAmountCents = formData.get("plannedAmountCents");
    const result = await onAdd({
      name: typeof name === "string" ? name : "",
      plannedAmountCents: typeof plannedAmountCents === "string" ? plannedAmountCents : undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsOpen(false);
    } else {
      setError(result.message ?? "Couldn't add that category.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Text size="body-sm" tone="faint">
            Quick add:
          </Text>
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleAddSuggestion(name)}
              disabled={pendingSuggestion !== null}
              className={`rounded-full transition-opacity duration-150 ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${pendingSuggestion !== null ? "opacity-50" : ""}`}
            >
              <Badge variant="outline" className="cursor-pointer hover:border-line-strong">
                {pendingSuggestion === name ? "Adding..." : `+ ${name}`}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {isOpen ? (
        <form action={handleSubmit} className="grid gap-3 rounded-md border border-line bg-surface-muted/40 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Input name="name" maxLength={100} aria-label="Category name" placeholder="Category name" required autoFocus />
          <Input name="plannedAmountCents" inputMode="decimal" aria-label="Planned amount" placeholder="0.00" className="sm:w-32" />
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          leadingIcon={<Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />}
          onClick={() => setIsOpen(true)}
        >
          Add custom category
        </Button>
      )}

      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}
    </div>
  );
}

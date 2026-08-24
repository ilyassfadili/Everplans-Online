"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button, Checkbox, Icon, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { PACKING_CATEGORY_OPTIONS } from "@/components/travel/packing-category-options";
import type { DeletePackingItemResult, PackingItemInput, PackingItemMutationResult } from "@/lib/travel/packing";
import type { PackingItem } from "@/types/travel";

interface PackingItemRowProps {
  item: PackingItem;
  onToggle: (itemId: string, isComplete: boolean) => Promise<PackingItemMutationResult>;
  onSave: (itemId: string, input: PackingItemInput) => Promise<PackingItemMutationResult>;
  onDelete: (itemId: string) => Promise<DeletePackingItemResult>;
}

/**
 * One packing checklist item - a checkbox that saves the moment it's
 * clicked (Phase 1's own "quick to use" requirement: check items off
 * without opening anything), with a lightweight expanding edit for
 * name/category/quantity/notes. Optimistic on the checkbox specifically -
 * it flips immediately and only reverts if the save actually fails, so
 * checking off a packing list never feels laggy.
 */
export function PackingItemRow({ item, onToggle, onSave, onDelete }: PackingItemRowProps) {
  const [isComplete, setIsComplete] = useState(item.isComplete);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const next = !isComplete;
    setIsComplete(next);
    setError(null);
    const result = await onToggle(item.id, next);
    if (result.status !== "success") {
      setIsComplete(!next);
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await onSave(item.id, {
      name: formData.get("name")?.toString() ?? "",
      category: (formData.get("category")?.toString() || "other") as PackingItemInput["category"],
      quantity: formData.get("quantity")?.toString() ?? "1",
      notes: formData.get("notes")?.toString() || undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that item.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${item.name}" from your packing list?`)) return;
    setIsDeleting(true);
    const result = await onDelete(item.id);
    if (result.status !== "success") {
      setIsDeleting(false);
      setError(result.message ?? "Couldn't remove that item.");
    }
  }

  if (isEditing) {
    return (
      <li className="rounded-md border border-line bg-surface-muted/40 p-4">
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input name="name" defaultValue={item.name} maxLength={150} aria-label="Item name" required />
            <Select name="category" options={PACKING_CATEGORY_OPTIONS} defaultValue={item.category} aria-label="Category" className="sm:w-44" />
            <Input name="quantity" type="number" min={1} max={999} defaultValue={item.quantity} aria-label="Quantity" className="sm:w-20" />
          </div>
          <Textarea name="notes" defaultValue={item.notes ?? ""} maxLength={500} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
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
    <li className="flex items-start gap-3 py-2.5">
      <label className="flex flex-1 cursor-pointer items-start gap-3">
        <Checkbox checked={isComplete} onChange={handleToggle} aria-label={`Mark "${item.name}" ${isComplete ? "not packed" : "packed"}`} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <Text size="body-sm" weight="medium" className={isComplete ? "text-ink-faint line-through decoration-line" : "text-ink"}>
            {item.name}
            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
          </Text>
          {item.notes && (
            <Text size="body-sm" tone="muted" className="mt-0.5">
              {item.notes}
            </Text>
          )}
          {error && (
            <Text size="body-sm" tone="error" className="mt-0.5">
              {error}
            </Text>
          )}
        </div>
      </label>
      <div className="flex shrink-0 items-center gap-1">
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
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Remove "${item.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

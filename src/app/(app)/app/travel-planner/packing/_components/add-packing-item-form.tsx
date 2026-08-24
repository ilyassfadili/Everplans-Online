"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { PACKING_CATEGORY_OPTIONS } from "@/components/travel/packing-category-options";
import type { PackingItemInput, PackingItemMutationResult } from "@/lib/travel/packing";

interface AddPackingItemFormProps {
  onAdd: (input: PackingItemInput) => Promise<PackingItemMutationResult>;
}

/** The packing list's own quick-add row - name, category, quantity, always visible (unlike `AddActivityForm`'s toggle) since a packing list is meant to be built up quickly, one item after another. */
export function AddPackingItemForm({ onAdd }: AddPackingItemFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await onAdd({
      name: formData.get("name")?.toString() ?? "",
      category: (formData.get("category")?.toString() || "other") as PackingItemInput["category"],
      quantity: formData.get("quantity")?.toString() || "1",
    });

    setIsSaving(false);
    if (result.status !== "success") {
      setError(result.message ?? "Couldn't add that item.");
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <Text size="body-sm" tone="error">
          {error}
        </Text>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <Input name="name" maxLength={150} aria-label="Item name" placeholder="Add an item..." required />
        <Select name="category" options={PACKING_CATEGORY_OPTIONS} defaultValue="other" aria-label="Category" className="sm:w-44" />
        <Input name="quantity" type="number" min={1} max={999} defaultValue={1} aria-label="Quantity" className="sm:w-20" />
        <Button type="submit" size="md" loading={isSaving} leadingIcon={<Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />}>
          Add
        </Button>
      </div>
    </form>
  );
}

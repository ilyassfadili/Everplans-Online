"use client";

import { useState, useTransition } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Stack, Text } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { getInventoryCategoryLabel } from "@/components/home-planner/inventory-category-options";
import { InventoryItemFormFields } from "@/components/home-planner/inventory-item-form-fields";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/home-planner/format-currency";
import type { InventoryItem } from "@/types/home-planner";

import { editInventoryItemAction, removeInventoryItemAction, toggleItemImportantAction } from "../actions";

interface ItemRowProps {
  item: InventoryItem;
  roomOptions: SelectOption[];
  roomName: string | null;
}

/** One inventory item - the same "inline-form toggle" editing pattern `GuestRow`/`MemberRow`/`ContactRow` establish. */
export function ItemRow({ item, roomOptions, roomName }: ItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingImportant, startImportantTransition] = useTransition();

  function handleToggleImportant() {
    startImportantTransition(() => {
      void toggleItemImportantAction(item.id, !item.isImportant);
    });
  }

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    const result = await editInventoryItemAction(item.id, {
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? "") as InventoryItem["category"],
      roomId: String(formData.get("roomId") ?? ""),
      quantity: String(formData.get("quantity") ?? "1"),
      purchaseDate: String(formData.get("purchaseDate") ?? ""),
      purchaseInfo: String(formData.get("purchaseInfo") ?? ""),
      estimatedValueDollars: String(formData.get("estimatedValueDollars") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleDelete() {
    if (window.confirm(`Remove ${item.name} from your inventory?`)) {
      void removeInventoryItemAction(item.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <InventoryItemFormFields
            roomOptions={roomOptions}
            defaultValues={{
              name: item.name,
              category: item.category,
              roomId: item.roomId,
              quantity: item.quantity,
              purchaseDate: item.purchaseDate,
              purchaseInfo: item.purchaseInfo,
              estimatedValueDollars: item.estimatedValueCents !== null ? (item.estimatedValueCents / 100).toFixed(2) : "",
              notes: item.notes,
            }}
          />
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
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Text size="body" weight="medium" className="text-ink">
            {item.name}
          </Text>
          <Badge variant="neutral">{getInventoryCategoryLabel(item.category)}</Badge>
          {roomName && <Badge variant="neutral">{roomName}</Badge>}
        </div>
        <Stack direction="row" gap="3" className="mt-1 flex-wrap">
          <Text size="body-sm" tone="muted">
            Qty {item.quantity}
          </Text>
          {item.estimatedValueCents !== null && (
            <Text size="body-sm" tone="muted">
              {formatMoney(item.estimatedValueCents)}
            </Text>
          )}
          {item.purchaseInfo && (
            <Text size="body-sm" tone="muted">
              {item.purchaseInfo}
            </Text>
          )}
        </Stack>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleToggleImportant}
          disabled={isTogglingImportant}
          aria-pressed={item.isImportant}
          aria-label={item.isImportant ? `Remove ${item.name} from important items` : `Mark ${item.name} as important`}
          className={cn(
            "-m-1.5 rounded-sm p-1.5 transition-colors duration-150 ease-standard hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            item.isImportant ? "text-warning" : "text-ink-faint hover:text-ink",
          )}
        >
          <Icon icon={Star} size="sm" className={item.isImportant ? "fill-current" : undefined} />
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${item.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove ${item.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}

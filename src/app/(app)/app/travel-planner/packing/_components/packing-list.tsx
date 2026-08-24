"use client";

import { Luggage } from "lucide-react";

import { Card, EmptyState, ProgressRing, Stack, Text } from "@/components/ui";
import { getPackingCategoryLabel, PACKING_CATEGORY_ORDER } from "@/components/travel/packing-category-options";
import type { PackingItemInput } from "@/lib/travel/packing";
import type { PackingItem, PackingProgress } from "@/types/travel";

import { createPackingItemAction, deletePackingItemAction, togglePackingItemAction, updatePackingItemAction } from "../actions";
import { AddPackingItemForm } from "./add-packing-item-form";
import { PackingItemRow } from "./packing-item-row";

interface PackingListProps {
  tripId: string;
  items: PackingItem[];
  progress: PackingProgress;
}

/**
 * The packing checklist (Prompt 4 Phase 1) - a progress ring, quick-add,
 * and every item grouped by category (Phase 1 §7: "allow appropriate
 * organization/filtering by category"). Bound to `tripId` here so every
 * child gets ready-to-call actions without threading it through each row.
 */
export function PackingList({ tripId, items, progress }: PackingListProps) {
  async function handleAdd(input: PackingItemInput) {
    return createPackingItemAction(tripId, input);
  }

  const groups = PACKING_CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <Stack gap="6">
      <Card variant="standard" padding="lg">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <ProgressRing percent={progress.percent} size={72} strokeWidth={7} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-body-lg leading-none text-ink">{progress.percent}%</span>
            </div>
          </div>
          <div>
            <Text size="body" weight="medium" className="text-ink">
              {progress.completedCount} of {progress.totalCount} packed
            </Text>
            <Text size="body-sm" tone="muted" className="mt-0.5">
              {progress.totalCount === 0 ? "Add your first item below." : "Check items off as you pack them."}
            </Text>
          </div>
        </div>
      </Card>

      <Card variant="standard" padding="lg">
        <AddPackingItemForm onAdd={handleAdd} />
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="Nothing on your packing list yet"
          description="Add your first item above to start building your checklist."
          className="py-14"
        />
      ) : (
        <Stack gap="4">
          {groups.map((group) => (
            <Card key={group.category} variant="standard" padding="lg">
              <Text size="body-sm" weight="semibold" className="text-ink">
                {getPackingCategoryLabel(group.category)}
              </Text>
              <ul className="mt-2 flex flex-col divide-y divide-line-subtle">
                {group.items.map((item) => (
                  <PackingItemRow
                    key={item.id}
                    item={item}
                    onToggle={togglePackingItemAction}
                    onSave={updatePackingItemAction}
                    onDelete={deletePackingItemAction}
                  />
                ))}
              </ul>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

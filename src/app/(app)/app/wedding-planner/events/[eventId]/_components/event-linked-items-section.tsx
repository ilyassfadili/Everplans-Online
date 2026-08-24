"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button, Card, Heading, Icon, Select, Text } from "@/components/ui";

interface LinkedItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface LinkMutationResult {
  status: string;
  message?: string;
}

interface EventLinkedItemsSectionProps {
  title: string;
  emptyText: string;
  linkedItems: LinkedItem[];
  /** Items not yet linked - the add picker's own options, so the same item can't be added twice. */
  availableItems: LinkedItem[];
  addPlaceholder: string;
  onAdd: (id: string) => Promise<LinkMutationResult>;
  onRemove: (id: string) => void;
}

/**
 * The event detail page's own "which vendors/guests are part of this
 * event" section (Prompt 5 Phase 2) - one generic shape reused for both
 * relationships, since they're structurally identical: a list of
 * canonical records already linked, plus a picker to link one more. Never
 * a copy of vendor/guest data - `linkedItems`/`availableItems` are built
 * from the real `wedding_vendors`/`wedding_guests` records one layer up.
 */
export function EventLinkedItemsSection({ title, emptyText, linkedItems, availableItems, addPlaceholder, onAdd, onRemove }: EventLinkedItemsSectionProps) {
  const [isAdding, startAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(value: string) {
    setIsSaving(true);
    const result = await onAdd(value);
    setIsSaving(false);
    if (result.status === "success") {
      setError(null);
      startAdding(false);
    } else {
      setError(result.message ?? "Couldn't add that.");
    }
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          {title}
        </Heading>
        {availableItems.length > 0 && !isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => startAdding(true)}>
            Add
          </Button>
        )}
      </div>

      {linkedItems.length === 0 ? (
        <Text size="body-sm" tone="muted" className="mt-3">
          {emptyText}
        </Text>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {linkedItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <Text size="body" weight="medium" className="text-ink">
                  {item.label}
                </Text>
                {item.sublabel && (
                  <Text size="body-sm" tone="muted">
                    {item.sublabel}
                  </Text>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.label}`}
                className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Icon icon={X} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <div className="mt-4 flex flex-col gap-2 border-t border-line-subtle pt-4">
          <Select
            aria-label={addPlaceholder}
            placeholder={addPlaceholder}
            options={availableItems.map((item) => ({ value: item.id, label: item.label }))}
            onValueChange={handleAdd}
            disabled={isSaving}
          />
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => startAdding(false)}>
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}

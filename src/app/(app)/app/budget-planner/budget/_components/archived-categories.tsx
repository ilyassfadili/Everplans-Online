"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button, Icon, Text } from "@/components/ui";
import type { BudgetCategory } from "@/types/budget";

import { restoreCategoryAction } from "../actions";

interface ArchivedCategoriesProps {
  archivedCategories: BudgetCategory[];
}

/**
 * Archived categories (Prompt 5 Phase 1) - collapsed by default, so a
 * calm budget page doesn't lead with a list of things the user removed.
 * Existing expenses/recurring items that still reference one of these keep
 * working regardless of whether it's ever restored - archiving only ever
 * affects what shows up as an option for *new* assignments.
 */
export function ArchivedCategories({ archivedCategories }: ArchivedCategoriesProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (archivedCategories.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-1.5 text-body-sm font-medium text-ink-muted transition-colors duration-150 ease-standard hover:text-ink"
      >
        <Icon icon={isOpen ? ChevronUp : ChevronDown} size="sm" />
        Archived categories ({archivedCategories.length})
      </button>

      {isOpen && (
        <ul className="mt-2 flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface-muted/40 px-4">
          {archivedCategories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 py-2.5">
              <Text size="body-sm" tone="muted">
                {category.name}
              </Text>
              <Button variant="ghost" size="sm" onClick={() => void restoreCategoryAction(category.id)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

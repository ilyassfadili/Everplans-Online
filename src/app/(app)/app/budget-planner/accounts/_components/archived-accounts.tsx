"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge, Button, Icon, Text } from "@/components/ui";
import type { BudgetAccount } from "@/types/budget";

import { restoreAccountAction } from "../actions";
import { ACCOUNT_TYPE_LABEL } from "./account-types";

interface ArchivedAccountsProps {
  archivedAccounts: BudgetAccount[];
}

/**
 * Archived accounts - collapsed by default, same reasoning as the Budget
 * page's `ArchivedCategories`: a calm Accounts page doesn't lead with a list
 * of things the user removed. Existing expenses/income entries that still
 * reference one of these keep working regardless of whether it's ever
 * restored - archiving only ever affects what shows up as a pick for *new*
 * assignments.
 */
export function ArchivedAccounts({ archivedAccounts }: ArchivedAccountsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (archivedAccounts.length === 0) {
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
        Archived accounts ({archivedAccounts.length})
      </button>

      {isOpen && (
        <ul className="mt-2 flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface-muted/40 px-4">
          {archivedAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Text size="body-sm" tone="muted">
                  {account.name}
                </Text>
                <Badge variant="neutral">{ACCOUNT_TYPE_LABEL[account.type]}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void restoreAccountAction(account.id)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

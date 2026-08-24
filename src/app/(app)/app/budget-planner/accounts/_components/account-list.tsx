"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

import { Button, Card, EmptyState, Heading } from "@/components/ui";
import type { BudgetAccount } from "@/types/budget";

import { AccountRow } from "./account-row";
import { AddAccountForm } from "./add-account-form";
import { ArchivedAccounts } from "./archived-accounts";

interface AccountListProps {
  planId: string;
  accounts: BudgetAccount[];
}

/**
 * Accounts - a lightweight organizational list (name + type), each editable
 * in place and archivable, plus a collapsible add-account form and a
 * collapsed-by-default archived section. Entirely optional: this is manual
 * organization only, never a bank sync, and nothing else in the app requires
 * an account before expenses/income can be tracked.
 */
export function AccountList({ planId, accounts }: AccountListProps) {
  const [isAdding, setIsAdding] = useState(false);

  const activeAccounts = accounts.filter((account) => !account.isArchived);
  const archivedAccounts = accounts.filter((account) => account.isArchived);

  if (accounts.length === 0 && !isAdding) {
    return (
      <Card variant="standard" padding="lg">
        <EmptyState
          icon={Wallet}
          title="Accounts are entirely optional"
          description="Add checking, savings, cash, or credit card accounts to note where an expense or income entry came from. Nothing else in the app requires one - you can track expenses and income with no accounts at all."
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add an account
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Accounts
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add account
          </Button>
        )}
      </div>

      {activeAccounts.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {activeAccounts.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
        </ul>
      )}

      {isAdding && <AddAccountForm planId={planId} onCancel={() => setIsAdding(false)} />}

      {archivedAccounts.length > 0 && (
        <div className="mt-6 border-t border-line-subtle pt-4">
          <ArchivedAccounts archivedAccounts={archivedAccounts} />
        </div>
      )}
    </Card>
  );
}

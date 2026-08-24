"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";

import { Button, Card, EmptyState, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { formatMonthLabel, type MonthKey } from "@/lib/budget/month";
import type { BudgetAccount, BudgetCategory, BudgetIncomeEntry } from "@/types/budget";

import { AddIncomeEntryForm } from "./add-income-entry-form";
import { IncomeEntryRow } from "./income-entry-row";

interface IncomeEntryListProps {
  planId: string;
  month: MonthKey;
  entries: BudgetIncomeEntry[];
  categories: BudgetCategory[];
  accounts: BudgetAccount[];
  currency: string;
}

/**
 * "Income received" - the dated, actual-income ledger (Everplans Money
 * Prompt 2), month-scoped via `entries` (already filtered by the page to
 * `month`'s date range). Deliberately its own card, separate from
 * `IncomeList`'s "recurring income" section above it on the same page: this
 * is what actually landed on a specific date, that is what's expected to
 * repeat - conflating the two would make neither total trustworthy.
 */
export function IncomeEntryList({ planId, month, entries, categories, accounts, currency }: IncomeEntryListProps) {
  const [isAdding, setIsAdding] = useState(false);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const totalCents = entries.reduce((sum, entry) => sum + entry.amountCents, 0);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Heading as="h2" size="h4">
            Income received
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-1">
            Total income this month: {formatCurrency(totalCents, currency)}
          </Text>
        </div>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add income
          </Button>
        )}
      </div>

      {entries.length === 0 && !isAdding && (
        <EmptyState
          icon={PiggyBank}
          title="Nothing logged for this month yet"
          description={`Record income as it actually arrives - a paycheck, a payment, a gift - and it'll count toward ${formatMonthLabel(month)}.`}
          className="mt-4 py-10"
          action={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Log your first income for this month
            </Button>
          }
        />
      )}

      {entries.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {entries.map((entry) => (
            <IncomeEntryRow
              key={entry.id}
              entry={entry}
              currency={currency}
              categories={categories}
              accounts={accounts}
              categoryName={entry.categoryId ? (categoryById.get(entry.categoryId)?.name ?? null) : null}
              accountName={entry.accountId ? (accountById.get(entry.accountId)?.name ?? null) : null}
            />
          ))}
        </ul>
      )}

      {isAdding && (
        <AddIncomeEntryForm
          planId={planId}
          month={month}
          categories={categories}
          accounts={accounts}
          onCancel={() => setIsAdding(false)}
        />
      )}
    </Card>
  );
}

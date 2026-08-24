import { Receipt, SearchX } from "lucide-react";

import { Button, EmptyState, Text } from "@/components/ui";
import type { BudgetAccount, BudgetCategory, BudgetTransaction } from "@/types/budget";

import { TransactionRow } from "./transaction-row";

interface TransactionsListProps {
  /** Already sliced to `limit` - the rows this render actually shows. */
  transactions: BudgetTransaction[];
  /** Every transaction matching the current month + filters, before the `limit` slice - `transactions.length` once everything has loaded, larger while a "Load more" is still available. */
  totalCount: number;
  hasActiveFilters: boolean;
  categories: BudgetCategory[];
  accounts: BudgetAccount[];
  currency: string;
  clearFiltersHref: string;
  loadMoreHref: string | null;
}

/**
 * The Transactions view's own list body (Everplans Money Prompt 2 Phase 4) -
 * a flat, already-sorted list (no extra grouping - "do not build an
 * unnecessarily complex data-grid system"), each row resolving its own
 * category/account name from the plan's full lists so an archived category
 * or account still displays correctly instead of reading as blank. Two
 * distinct empty states: nothing logged this month at all (encouraging,
 * points at where to add it) vs. filters that matched nothing (lighter,
 * offers a way back to the unfiltered view) - `hasActiveFilters` is what
 * tells them apart, since a truly empty month is never itself a filter.
 */
export function TransactionsList({
  transactions,
  totalCount,
  hasActiveFilters,
  categories,
  accounts,
  currency,
  clearFiltersHref,
  loadMoreHref,
}: TransactionsListProps) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  if (totalCount === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={SearchX}
          title="No matching transactions"
          description="Try a different search, category, or account - or clear your filters to see everything logged this month."
          action={
            <Button href={clearFiltersHref} variant="outline" size="sm">
              Clear filters
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={Receipt}
        title="Nothing logged this month yet"
        description="Record income and expenses to see them show up here, all in one place."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button href="/app/budget-planner/income" size="sm">
              Add income
            </Button>
            <Button href="/app/budget-planner/expenses" variant="outline" size="sm">
              Add expense
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface px-4">
        {transactions.map((transaction) => (
          <TransactionRow
            key={`${transaction.type}-${transaction.id}`}
            transaction={transaction}
            currency={currency}
            categoryName={transaction.categoryId ? (categoryById.get(transaction.categoryId)?.name ?? null) : null}
            accountName={transaction.accountId ? (accountById.get(transaction.accountId)?.name ?? null) : null}
            categories={categories}
            accounts={accounts}
          />
        ))}
      </ul>

      <div className="flex flex-col items-center gap-2">
        <Text size="body-sm" tone="muted">
          Showing {transactions.length} of {totalCount} transaction{totalCount === 1 ? "" : "s"}
        </Text>
        {loadMoreHref && (
          <Button href={loadMoreHref} variant="outline" size="sm">
            Load more
          </Button>
        )}
      </div>
    </div>
  );
}

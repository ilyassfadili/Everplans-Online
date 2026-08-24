"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState, Icon, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { BudgetAccount, BudgetCategory, BudgetExpense } from "@/types/budget";

import { ExpenseList } from "./expense-list";
import { ExpenseRow } from "./expense-row";

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high to low" },
  { value: "amount-asc", label: "Amount: low to high" },
];

function sortExpenses(expenses: BudgetExpense[], sortBy: SortOption): BudgetExpense[] {
  const sorted = [...expenses];
  switch (sortBy) {
    case "date-asc":
      return sorted.sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
    case "amount-desc":
      return sorted.sort((a, b) => b.amountCents - a.amountCents);
    case "amount-asc":
      return sorted.sort((a, b) => a.amountCents - b.amountCents);
    case "date-desc":
    default:
      return sorted.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  }
}

interface ExpensesBrowserProps {
  expenses: BudgetExpense[];
  categories: BudgetCategory[];
  currency: string;
  accounts: BudgetAccount[];
  allAccounts: BudgetAccount[];
}

/**
 * The Expenses page's own search/sort/browse experience (Prompt 3 Phase 1).
 * Client-side over the already-fetched list - no extra round trip for what
 * is, for any one plan, a genuinely small dataset. Two read modes:
 * grouped-by-category (the default, calm view Prompt 2 Phase 3 established)
 * when nothing is actively being searched or re-sorted, and a flat
 * search-result list once a query or a non-default sort is applied, since
 * grouping and cross-category sorting can't coexist meaningfully.
 */
export function ExpensesBrowser({ expenses, categories, currency, accounts, allAccounts }: ExpensesBrowserProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const accountById = useMemo(() => new Map(allAccounts.map((account) => [account.id, account])), [allAccounts]);

  const trimmedQuery = query.trim().toLowerCase();
  const isBrowsing = trimmedQuery.length === 0 && sortBy === "date-desc";

  const filtered = useMemo(() => {
    if (!trimmedQuery) return expenses;
    return expenses.filter((expense) => {
      const categoryName = expense.categoryId ? (categoryById.get(expense.categoryId)?.name ?? "") : "";
      return (
        expense.title.toLowerCase().includes(trimmedQuery) ||
        (expense.note ?? "").toLowerCase().includes(trimmedQuery) ||
        categoryName.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [expenses, trimmedQuery, categoryById]);

  const sorted = useMemo(() => sortExpenses(filtered, sortBy), [filtered, sortBy]);

  if (expenses.length === 0) {
    // The "nothing logged at all" empty state is `ExpenseList`'s own -
    // rendering it here too would duplicate that message the moment the
    // very first expense makes `isBrowsing` false.
    return <ExpenseList expenses={expenses} categories={categories} currency={currency} accounts={accounts} allAccounts={allAccounts} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon icon={Search} size="sm" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search expenses by name, note, or category"
            aria-label="Search expenses"
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)} options={SORT_OPTIONS} className="sm:w-56" />
      </div>

      {isBrowsing ? (
        <ExpenseList expenses={expenses} categories={categories} currency={currency} accounts={accounts} allAccounts={allAccounts} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching expenses"
          description="Try a different name, note, or category - or clear the search to see everything you've logged."
          className="py-10"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface px-4">
          {sorted.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              currency={currency}
              categories={categories}
              categoryName={expense.categoryId ? (categoryById.get(expense.categoryId)?.name ?? null) : null}
              accounts={accounts}
              accountName={expense.accountId ? (accountById.get(expense.accountId)?.name ?? null) : null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

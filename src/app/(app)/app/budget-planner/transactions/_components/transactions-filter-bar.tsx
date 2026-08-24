import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Button, FormField, Icon, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { MonthKey } from "@/lib/budget/month";
import type { TransactionSort, TransactionTypeFilter } from "@/lib/budget/transactions";
import type { BudgetAccount, BudgetCategory } from "@/types/budget";

const TRANSACTIONS_PATH = "/app/budget-planner/transactions";

/** Sentinel used by the category/account `<Select>`s for "no filter" - Radix's `Select.Item` can't take an empty-string `value`, so `"all"` stands in and the page treats it the same as an absent param. */
const ALL_VALUE = "all";

const SORT_OPTIONS: { value: TransactionSort; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high to low" },
  { value: "amount-asc", label: "Amount: low to high" },
];

const TYPE_TABS: { value: TransactionTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
];

interface TransactionsFilterBarProps {
  month: MonthKey;
  type: TransactionTypeFilter;
  categoryId?: string;
  accountId?: string;
  query: string;
  sort: TransactionSort;
  categories: BudgetCategory[];
  accounts: BudgetAccount[];
}

function typeTabHref(
  month: MonthKey,
  type: TransactionTypeFilter,
  categoryId: string | undefined,
  accountId: string | undefined,
  query: string,
  sort: TransactionSort,
): string {
  const params = new URLSearchParams({ month });
  if (type !== "all") params.set("type", type);
  if (categoryId) params.set("category", categoryId);
  if (accountId) params.set("account", accountId);
  if (query) params.set("q", query);
  if (sort !== "date-desc") params.set("sort", sort);
  return `${TRANSACTIONS_PATH}?${params.toString()}`;
}

/**
 * The Transactions view's own filter bar (Everplans Money Prompt 2 Phase 4) -
 * type is a plain segmented set of links (each a full page navigation that
 * preserves every other active param), everything else lives in one
 * `<form method="GET">` that resubmits the whole query string on "Apply
 * filters". No client JS anywhere in this component - the page itself is
 * already entirely driven by `searchParams`, so a native GET form is both
 * the simplest and the most robust way to change it.
 */
export function TransactionsFilterBar({ month, type, categoryId, accountId, query, sort, categories, accounts }: TransactionsFilterBarProps) {
  const categoryOptions = [{ value: ALL_VALUE, label: "All categories" }, ...categories.map((category) => ({ value: category.id, label: category.name }))];
  const accountOptions = [{ value: ALL_VALUE, label: "All accounts" }, ...accounts.map((account) => ({ value: account.id, label: account.name }))];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line-subtle bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by type">
        {TYPE_TABS.map((tab) => (
          <Button
            key={tab.value}
            href={typeTabHref(month, tab.value, categoryId, accountId, query, sort)}
            variant={type === tab.value ? "primary" : "outline"}
            size="sm"
            aria-current={type === tab.value ? "page" : undefined}
            leadingIcon={
              tab.value === "income" ? (
                <Icon icon={ArrowDownLeft} size="sm" />
              ) : tab.value === "expense" ? (
                <Icon icon={ArrowUpRight} size="sm" />
              ) : undefined
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <form method="GET" action={TRANSACTIONS_PATH} className="flex flex-col gap-3 border-t border-line-subtle pt-4">
        {/* Preserves the month and type - both driven by controls outside this form (MonthSwitcher, the segmented tabs above) - so submitting it never resets either. */}
        <input type="hidden" name="month" value={month} />
        {type !== "all" && <input type="hidden" name="type" value={type} />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Category">
            <Select name="category" defaultValue={categoryId ?? ALL_VALUE} options={categoryOptions} />
          </FormField>
          <FormField label="Account">
            <Select name="account" defaultValue={accountId ?? ALL_VALUE} options={accountOptions} />
          </FormField>
          <FormField label="Sort by">
            <Select name="sort" defaultValue={sort} options={SORT_OPTIONS} />
          </FormField>
          <FormField label="Search">
            <Input name="q" defaultValue={query} placeholder="Title or note" />
          </FormField>
        </div>

        <div>
          <Button type="submit" variant="secondary" size="sm">
            Apply filters
          </Button>
        </div>
      </form>
    </div>
  );
}

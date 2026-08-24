import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { getAllAccountsForPlan } from "@/lib/budget/accounts";
import { getAllCategoriesForPlan } from "@/lib/budget/categories";
import { parseMonthParam } from "@/lib/budget/month";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";
import { getTransactionsForPlan, type TransactionSort, type TransactionTypeFilter } from "@/lib/budget/transactions";

import { PageHeader } from "../../_components/page-header";
import { MonthSwitcher } from "../_components/month-switcher";
import { TransactionsFilterBar } from "./_components/transactions-filter-bar";
import { TransactionsList } from "./_components/transactions-list";

export const metadata: Metadata = {
  title: "Transactions",
  robots: { index: false, follow: false },
};

const TRANSACTIONS_PATH = "/app/budget-planner/transactions";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;
const TYPE_VALUES: TransactionTypeFilter[] = ["all", "income", "expense"];
const SORT_VALUES: TransactionSort[] = ["date-desc", "date-asc", "amount-desc", "amount-asc"];

function parseType(value: string | undefined): TransactionTypeFilter {
  return (TYPE_VALUES as string[]).includes(value ?? "") ? (value as TransactionTypeFilter) : "all";
}

function parseSort(value: string | undefined): TransactionSort {
  return (SORT_VALUES as string[]).includes(value ?? "") ? (value as TransactionSort) : "date-desc";
}

function parseLimit(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, MAX_LIMIT) : DEFAULT_LIMIT;
}

interface TransactionsPageProps {
  searchParams: Promise<{
    month?: string;
    type?: string;
    category?: string;
    account?: string;
    q?: string;
    sort?: string;
    limit?: string;
  }>;
}

/**
 * The unified Transactions page (Everplans Money Prompt 2 Phase 4) - one
 * flat, filterable, month-scoped view over `getTransactionsForPlan`'s merge
 * of `budget_expenses` and `budget_income_entries`. Entirely driven by
 * `searchParams`: every filter is a real query param, so the current view
 * is always a shareable/bookmarkable/back-button-safe URL rather than
 * client-only state, and the month/type/category/account/search/sort
 * controls never fight each other over who owns "the" filtered list.
 */
export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const plan = await requireBudgetPlanForCurrentUser();

  const params = await searchParams;

  const month = parseMonthParam(params.month);
  const type = parseType(params.type);
  const categoryId = params.category?.trim() || undefined;
  const accountId = params.account?.trim() || undefined;
  const query = params.q?.trim() || undefined;
  const sort = parseSort(params.sort);
  const limit = parseLimit(params.limit);

  const [matchingTransactions, categories, accounts] = await Promise.all([
    getTransactionsForPlan(plan.id, { month, type, categoryId, accountId, query, sort }),
    getAllCategoriesForPlan(plan.id),
    getAllAccountsForPlan(plan.id),
  ]);

  const transactions = matchingTransactions.slice(0, limit);
  const hasActiveFilters = type !== "all" || Boolean(categoryId) || Boolean(accountId) || Boolean(query);

  // Preserves every active filter (never `limit` - a fresh filter or month
  // change is meant to restart pagination from the top) whenever the month
  // itself changes via `MonthSwitcher`.
  const extraParams: Record<string, string> = {};
  if (type !== "all") extraParams.type = type;
  if (categoryId) extraParams.category = categoryId;
  if (accountId) extraParams.account = accountId;
  if (query) extraParams.q = query;
  if (sort !== "date-desc") extraParams.sort = sort;

  const clearFiltersHref = `${TRANSACTIONS_PATH}?month=${month}`;

  const loadMoreHref = (() => {
    if (matchingTransactions.length <= transactions.length) return null;
    const nextParams = new URLSearchParams({ month, limit: String(limit + DEFAULT_LIMIT) });
    if (type !== "all") nextParams.set("type", type);
    if (categoryId) nextParams.set("category", categoryId);
    if (accountId) nextParams.set("account", accountId);
    if (query) nextParams.set("q", query);
    if (sort !== "date-desc") nextParams.set("sort", sort);
    return `${TRANSACTIONS_PATH}?${nextParams.toString()}`;
  })();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Transactions" description="Every income and expense in one place - search, filter, and edit any of it." />

      <div className="flex flex-col gap-4">
        <MonthSwitcher month={month} basePath={TRANSACTIONS_PATH} extraParams={extraParams} />
        <TransactionsFilterBar
          month={month}
          type={type}
          categoryId={categoryId}
          accountId={accountId}
          query={query ?? ""}
          sort={sort}
          categories={categories}
          accounts={accounts}
        />
      </div>

      <TransactionsList
        transactions={transactions}
        totalCount={matchingTransactions.length}
        hasActiveFilters={hasActiveFilters}
        categories={categories}
        accounts={accounts}
        currency={plan.currency}
        clearFiltersHref={clearFiltersHref}
        loadMoreHref={loadMoreHref}
      />
    </Container>
  );
}

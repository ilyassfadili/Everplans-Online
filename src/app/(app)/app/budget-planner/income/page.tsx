import type { Metadata } from "next";
import { Container, Text } from "@/components/ui";
import { getAllAccountsForPlan } from "@/lib/budget/accounts";
import { calculateIncomeSummary } from "@/lib/budget/budget";
import { getCategoriesForPlan } from "@/lib/budget/categories";
import { formatCurrency } from "@/lib/budget/currency";
import { getIncomeEntriesForPlan } from "@/lib/budget/income-entries";
import { getIncomeSourcesForPlan } from "@/lib/budget/income-sources";
import { getMonthDateRange, parseMonthParam } from "@/lib/budget/month";
import { getPeriodLabel } from "@/lib/budget/period";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";

import { PageHeader } from "../../_components/page-header";
import { MonthSwitcher } from "../_components/month-switcher";
import { IncomeEntryList } from "./_components/income-entry-list";
import { IncomeList } from "./_components/income-list";

export const metadata: Metadata = {
  title: "Income",
  robots: { index: false, follow: false },
};

/**
 * The Budget Planner's Income page. Two deliberately separate sections
 * (Everplans Money Prompt 2): "Recurring income" (`IncomeList`, Prompt 1's
 * original foundation, unscoped to any month - an ongoing *definition* like
 * "Salary, $3,000/monthly") above "Income received" (`IncomeEntryList`, new
 * here - the dated, actual ledger of what was received, scoped to whichever
 * month `MonthSwitcher` is currently showing). Conflating the two would make
 * neither total trustworthy, so each keeps its own heading, its own copy,
 * and its own card.
 */
export default async function IncomePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const plan = await requireBudgetPlanForCurrentUser();

  const { month: monthParam } = await searchParams;
  const month = parseMonthParam(monthParam);
  const dateRange = getMonthDateRange(month);

  const [incomeSources, incomeEntries, incomeCategories, accounts] = await Promise.all([
    getIncomeSourcesForPlan(plan.id),
    getIncomeEntriesForPlan(plan.id, dateRange),
    getCategoriesForPlan(plan.id, "income"),
    getAllAccountsForPlan(plan.id),
  ]);
  const summary = calculateIncomeSummary(incomeSources, plan.periodType);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Income"
        description={
          summary.activeSourceCount > 0
            ? `Expected ${formatCurrency(summary.totalExpectedCents, plan.currency)} per ${getPeriodLabel(plan.periodType)} from ${summary.activeSourceCount} active ${summary.activeSourceCount === 1 ? "source" : "sources"}.`
            : "Add every income source you have, on whatever schedule it follows."
        }
      />

      <div className="flex flex-col gap-3">
        <Text size="body-sm" tone="faint" className="uppercase tracking-[0.08em]">
          Ongoing - not tied to a specific month
        </Text>
        <IncomeList planId={plan.id} incomeSources={incomeSources} currency={plan.currency} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text size="body-sm" tone="faint" className="uppercase tracking-[0.08em]">
            What actually arrived this month
          </Text>
          <MonthSwitcher month={month} basePath="/app/budget-planner/income" />
        </div>
        <IncomeEntryList
          planId={plan.id}
          month={month}
          entries={incomeEntries}
          categories={incomeCategories}
          accounts={accounts}
          currency={plan.currency}
        />
      </div>
    </Container>
  );
}

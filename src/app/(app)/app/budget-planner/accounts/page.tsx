import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getAllAccountsForPlan } from "@/lib/budget/accounts";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";

import { PageHeader } from "../../_components/page-header";
import { AccountList } from "./_components/account-list";

export const metadata: Metadata = {
  title: "Accounts",
  robots: { index: false, follow: false },
};

/**
 * The Budget Planner's Accounts page (Everplans Money Prompt 1's "Accounts
 * foundation") - manual organization only (checking, savings, cash, credit
 * card) so income and expenses can note where the money came from or went.
 * Entirely optional: nothing else in the app requires an account before
 * expenses/income can be tracked, and this is never a bank sync.
 */
export default async function AccountsPage() {
  const plan = await requireBudgetPlanForCurrentUser();

  const accounts = await getAllAccountsForPlan(plan.id);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Accounts"
        description="Optionally organize where your money comes from and goes - checking, savings, cash, or a credit card."
      />
      <AccountList planId={plan.id} accounts={accounts} />
    </Container>
  );
}

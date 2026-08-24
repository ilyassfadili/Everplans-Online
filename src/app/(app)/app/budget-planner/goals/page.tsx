import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { calculateTotalPlannedSavingsCents } from "@/lib/budget/budget";
import { getGoalsForPlan } from "@/lib/budget/goals";
import { requireBudgetPlanForCurrentUser } from "@/lib/budget/plans";
import { getSavingsTargetsForPlan } from "@/lib/budget/savings-targets";

import { PageHeader } from "../../_components/page-header";
import { AddGoalForm } from "./_components/add-goal-form";
import { GoalCard } from "./_components/goal-card";
import { SavingsSection } from "./_components/savings-section";

export const metadata: Metadata = {
  title: "Goals",
  robots: { index: false, follow: false },
};

/** The Budget Planner's Goals page - goal creation/progress (Prompt 3 Phase 3) plus savings planning (Prompt 3 Phase 4), which lives here rather than a separate module since the two are naturally one continuous idea. */
export default async function GoalsPage() {
  const plan = await requireBudgetPlanForCurrentUser();

  const [goals, savingsTargets] = await Promise.all([getGoalsForPlan(plan.id), getSavingsTargetsForPlan(plan.id)]);
  const totalPlannedSavingsCents = calculateTotalPlannedSavingsCents(savingsTargets, plan.periodType);

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <PageHeader title="Goals" description="Give your budget something to work toward." />
      <AddGoalForm planId={plan.id} hasAnyGoals={goals.length > 0} />
      {goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} currency={plan.currency} periodType={plan.periodType} />
          ))}
        </div>
      )}
      <SavingsSection
        planId={plan.id}
        savingsTargets={savingsTargets}
        goals={goals}
        currency={plan.currency}
        periodType={plan.periodType}
        totalPlannedCents={totalPlannedSavingsCents}
      />
    </Container>
  );
}

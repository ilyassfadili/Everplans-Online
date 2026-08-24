"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { createCategory } from "@/lib/budget/categories";
import { createGoal } from "@/lib/budget/goals";
import { createIncomeSource } from "@/lib/budget/income-sources";
import { createBudgetPlan } from "@/lib/budget/plans";
import { BUDGET_PLANNER_PRODUCT } from "@/config/products/budget-planner";
import { hasProductAccess } from "@/lib/entitlements";
import type { BudgetIncomeFrequency, BudgetPeriodType } from "@/types/budget";

/**
 * The onboarding wizard's own Server Action - unlike `createWeddingFormAction`
 * (a single one-step form), this orchestrates one required creation (the
 * plan itself) plus up to three optional ones (an income source, starter
 * categories, a goal), each skippable independently (Prompt 1 Phase 3:
 * "handle skipped optional information gracefully"). Called directly as an
 * async function from the client wizard (`OnboardingWizard`) rather than
 * through `useActionState` + `<form action>` - the wizard's state doesn't
 * map onto one flat `FormData`, so it collects everything itself and calls
 * this once, on "Create my budget."
 *
 * Only the plan creation can actually fail this whole action - a failed
 * optional create (already logged inside its own `@/lib/budget/*` function)
 * is treated as "the user didn't get quite everything they typed," not a
 * reason to strand them on the onboarding screen: they land in a real,
 * working workspace and can always re-add whatever didn't save from the
 * relevant page.
 */

export interface OnboardingIncomeInput {
  name: string;
  amountCents: string;
  frequency: string;
}

export interface OnboardingCategoryInput {
  name: string;
  plannedAmountCents: string;
}

export interface OnboardingGoalInput {
  name: string;
  targetAmountCents: string;
  targetDate: string;
}

export interface CompleteBudgetOnboardingInput {
  name: string;
  periodType: BudgetPeriodType;
  income: OnboardingIncomeInput | null;
  categories: OnboardingCategoryInput[];
  goal: OnboardingGoalInput | null;
}

export type CompleteBudgetOnboardingResult = { status: "error"; message: string };

export async function completeBudgetOnboardingAction(
  input: CompleteBudgetOnboardingInput,
): Promise<CompleteBudgetOnboardingResult> {
  // Everplans Money Prompt 3's real paywall enforcement, not just the
  // onboarding page's own redirect (`./page.tsx`'s doc comment) - never
  // trust that a client reached this action only through the UI path that
  // already checked entitlement first. Grandfathers anyone who somehow
  // already has a plan the same way the page does, by simply never
  // reaching this far (createBudgetPlan itself still enforces
  // `budget_plans_owner_unique` regardless).
  const user = await requireUser();
  if (!(await hasProductAccess(user.id, BUDGET_PLANNER_PRODUCT.plannerId))) {
    return { status: "error", message: "Purchase Budget Planner to set up your workspace." };
  }

  const planResult = await createBudgetPlan({ name: input.name, periodType: input.periodType });

  if (planResult.status !== "success") {
    return {
      status: "error",
      message: planResult.status === "invalid" ? planResult.message : "Couldn't set up your budget. Please try again.",
    };
  }

  const planId = planResult.plan.id;

  if (input.income && input.income.name.trim() && input.income.amountCents.trim()) {
    await createIncomeSource(planId, {
      name: input.income.name,
      amountCents: input.income.amountCents,
      // Cast, not trusted blindly - `createIncomeSource`'s own zod schema
      // re-validates this against the real enum and rejects anything else,
      // this just satisfies the input type for a value the wizard's own
      // `<Select>` already constrains to valid options.
      frequency: input.income.frequency as BudgetIncomeFrequency,
    });
  }

  for (const category of input.categories) {
    if (!category.name.trim()) continue;
    await createCategory(planId, { name: category.name, plannedAmountCents: category.plannedAmountCents });
  }

  if (input.goal && input.goal.name.trim() && input.goal.targetAmountCents.trim()) {
    await createGoal(planId, {
      name: input.goal.name,
      targetAmountCents: input.goal.targetAmountCents,
      targetDate: input.goal.targetDate,
    });
  }

  redirect("/app/budget-planner");
}

"use server";

import { revalidatePath } from "next/cache";

import { createGoal, deleteGoal, updateGoal, type CreateGoalInput, type GoalMutationResult, type UpdateGoalInput } from "@/lib/budget/goals";
import {
  createSavingsTarget,
  deleteSavingsTarget,
  updateSavingsTarget,
  type CreateSavingsTargetInput,
  type SavingsTargetMutationResult,
  type UpdateSavingsTargetInput,
} from "@/lib/budget/savings-targets";

const GOALS_PATH = "/app/budget-planner/goals";
const BUDGET_PLANNER_PATH = "/app/budget-planner";

function revalidateGoals() {
  revalidatePath(GOALS_PATH);
  revalidatePath(BUDGET_PLANNER_PATH);
}

export interface CreateGoalFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createGoalFormAction(planId: string, _prevState: CreateGoalFormState, formData: FormData): Promise<CreateGoalFormState> {
  const name = formData.get("name");
  const targetAmountCents = formData.get("targetAmountCents");
  const targetDate = formData.get("targetDate");
  const description = formData.get("description");

  const input: CreateGoalInput = {
    name: typeof name === "string" ? name : "",
    targetAmountCents: typeof targetAmountCents === "string" ? targetAmountCents : "",
    targetDate: typeof targetDate === "string" ? targetDate : undefined,
    description: typeof description === "string" ? description : undefined,
  };

  const result = await createGoal(planId, input);

  if (result.status === "success") {
    revalidateGoals();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editGoalAction(goalId: string, input: UpdateGoalInput): Promise<GoalMutationResult> {
  const result = await updateGoal(goalId, input);
  if (result.status === "success") {
    revalidateGoals();
  }
  return result;
}

export async function removeGoalAction(goalId: string): Promise<void> {
  await deleteGoal(goalId);
  revalidateGoals();
}

export interface CreateSavingsTargetFormState {
  status: "idle" | "invalid" | "error";
  message?: string;
}

export async function createSavingsTargetFormAction(
  planId: string,
  _prevState: CreateSavingsTargetFormState,
  formData: FormData,
): Promise<CreateSavingsTargetFormState> {
  const name = formData.get("name");
  const plannedAmountCents = formData.get("plannedAmountCents");
  const frequency = formData.get("frequency");
  const goalId = formData.get("goalId");

  const input: CreateSavingsTargetInput = {
    name: typeof name === "string" ? name : "",
    plannedAmountCents: typeof plannedAmountCents === "string" ? plannedAmountCents : "",
    frequency: typeof frequency === "string" ? (frequency as CreateSavingsTargetInput["frequency"]) : undefined,
    goalId: typeof goalId === "string" ? goalId : undefined,
  };

  const result = await createSavingsTarget(planId, input);

  if (result.status === "success") {
    revalidateGoals();
    return { status: "idle" };
  }
  return { status: result.status, message: result.message };
}

export async function editSavingsTargetAction(
  savingsTargetId: string,
  input: UpdateSavingsTargetInput,
): Promise<SavingsTargetMutationResult> {
  const result = await updateSavingsTarget(savingsTargetId, input);
  if (result.status === "success") {
    revalidateGoals();
  }
  return result;
}

export async function removeSavingsTargetAction(savingsTargetId: string): Promise<void> {
  await deleteSavingsTarget(savingsTargetId);
  revalidateGoals();
}

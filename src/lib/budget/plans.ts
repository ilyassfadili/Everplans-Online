import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { BUDGET_PLANNER_PRODUCT } from "@/config/products/budget-planner";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetPeriodType, BudgetPlan } from "@/types/budget";

/**
 * The Budget Planner's own workspace identity - the "getBudgetPlanForCurrentUser
 * / createBudgetPlan" pair the onboarding and workspace routes both build on.
 * Same shape as `@/lib/wedding/weddings`: every exported function calls
 * `requireUser()` itself and scopes its query to that resolved id, so there
 * is no parameter a caller could pass to make either act on someone else's
 * plan. Postgres RLS (`supabase/migrations/20260901000000_budget_planner_foundation.sql`)
 * is the second, independent enforcement of the same boundary.
 */

const PLAN_COLUMNS = "id, owner_id, name, currency, period_type, created_at, updated_at";

type PlanRow = {
  id: string;
  owner_id: string;
  name: string;
  currency: string;
  period_type: string;
  created_at: string;
  updated_at: string;
};

function mapPlanRow(row: PlanRow): BudgetPlan {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    currency: row.currency,
    // Cast, not re-validated: `budget_plans_period_type_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    periodType: row.period_type as BudgetPeriodType,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns the current user's budget plan, or `null` if they haven't
 * completed onboarding yet - the signal every Budget Planner route uses to
 * decide "show the workspace" vs. "redirect to onboarding". Redirects to
 * sign-in via `requireUser()` if there's no session at all.
 */
export async function getBudgetPlanForCurrentUser(): Promise<BudgetPlan | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("budget_plans").select(PLAN_COLUMNS).eq("owner_id", user.id).maybeSingle();

  // A real database/network failure, not "no row yet" (`maybeSingle` already
  // returns `data: null` for that case without an error) - logged for
  // operators, never surfaced as anything more specific than "no plan," so
  // callers can't distinguish "not onboarded" from "the database is down"
  // and render the wrong state.
  if (error) {
    console.error("getBudgetPlanForCurrentUser: failed to load budget plan", error);
    return null;
  }

  return data ? mapPlanRow(data) : null;
}

export type BudgetPlannerAccessResult =
  /** No active Budget Planner entitlement - the customer needs to buy it (or a prior purchase's entitlement was revoked/refunded) before anything else. Authoritative and checked BEFORE plan existence: a revoked entitlement must deny access even for a user who already has a `budget_plans` row from before the purchase requirement existed - Everplans Money Prompt 4's "revoked entitlements cannot access the product." */
  | { status: "needs-purchase" }
  /** Entitled, but hasn't completed the onboarding wizard yet - no `budget_plans` row exists. */
  | { status: "needs-onboarding" }
  /** Entitled AND onboarded - the only state that returns a real, usable `plan`. */
  | { status: "granted"; plan: BudgetPlan };

/**
 * The single, reusable "can the current user use Budget Planner right now"
 * check (Everplans Money Prompt 4 Phase 3's `hasProductAccess`-style
 * access layer, specialized for this one product) - every Budget Planner
 * page calls this instead of `getBudgetPlanForCurrentUser()` directly, so
 * entitlement is the authoritative gate everywhere, not just at onboarding.
 * Deliberately layered exactly as Prompt 4's own architecture rule
 * requires: authentication (`requireUser()`, inside `hasProductAccess`) is
 * separate from product entitlement (`hasProductAccess` itself) is separate
 * from product implementation (`getBudgetPlanForCurrentUser()`, this
 * product's own workspace data) - never collapsed into one boolean.
 */
export async function resolveBudgetPlannerAccess(): Promise<BudgetPlannerAccessResult> {
  const user = await requireUser();

  const entitled = await hasProductAccess(user.id, BUDGET_PLANNER_PRODUCT.plannerId);
  if (!entitled) {
    return { status: "needs-purchase" };
  }

  const plan = await getBudgetPlanForCurrentUser();
  if (!plan) {
    return { status: "needs-onboarding" };
  }

  return { status: "granted", plan };
}

/**
 * The one-line version of `resolveBudgetPlannerAccess()` every page actually
 * calls: redirects to checkout/onboarding as needed and returns the real
 * `BudgetPlan` only once access is fully granted. Keeps every page's own
 * gate to a single call instead of re-deriving the same three-way
 * redirect logic per route.
 */
export async function requireBudgetPlanForCurrentUser(): Promise<BudgetPlan> {
  const access = await resolveBudgetPlannerAccess();

  if (access.status === "needs-purchase") {
    redirect("/app/budget-planner/checkout");
  }
  if (access.status === "needs-onboarding") {
    redirect("/app/budget-planner/onboarding");
  }

  return access.plan;
}

const createPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .transform((value) => (value ? value : "My Budget")),
  periodType: z.enum(["weekly", "biweekly", "monthly", "yearly"]).optional().default("monthly"),
});

export type CreateBudgetPlanInput = z.input<typeof createPlanSchema>;

export type CreateBudgetPlanResult =
  | { status: "success"; plan: BudgetPlan }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Creates the current user's budget plan. Authenticate-then-validate, the
 * same sequence every mutation in this codebase follows.
 *
 * Duplicate-safe two ways, mirroring `createWedding`: onboarding itself
 * redirects away before this is ever called if a plan already exists (the
 * common case), and `budget_plans_owner_unique` (the migration) makes a
 * genuine race - a double submit, two tabs - fail at the database layer
 * instead of creating a second plan. A `23505` unique-violation here means
 * exactly that race happened, not a real error, so the existing plan is
 * fetched and returned as if this call had succeeded.
 */
export async function createBudgetPlan(input: CreateBudgetPlanInput): Promise<CreateBudgetPlanResult> {
  const user = await requireUser();

  const parsed = createPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_plans")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      period_type: parsed.data.periodType,
    })
    .select(PLAN_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const existing = await getBudgetPlanForCurrentUser();
      if (existing) {
        return { status: "success", plan: existing };
      }
    }

    console.error("createBudgetPlan: failed to create budget plan", error);
    return { status: "error", message: "Couldn't set up your budget. Please try again." };
  }

  if (!data) {
    return { status: "error", message: "Couldn't set up your budget. Please try again." };
  }

  return { status: "success", plan: mapPlanRow(data) };
}

const updatePlanSchema = z.object({
  name: z.string().trim().min(1, "Give your budget a name.").max(100, "Keep it under 100 characters.").optional(),
  periodType: z.enum(["weekly", "biweekly", "monthly", "yearly"]).optional(),
});

export type UpdateBudgetPlanInput = z.input<typeof updatePlanSchema>;

/** Edits the plan's own settings (name, period type) - the one row every other Budget Planner mutation ultimately hangs off. */
export async function updateBudgetPlan(planId: string, input: UpdateBudgetPlanInput): Promise<CreateBudgetPlanResult> {
  await requireUser();

  const parsed = updatePlanSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; period_type?: BudgetPeriodType } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.periodType !== undefined) patch.period_type = parsed.data.periodType;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("budget_plans").update(patch).eq("id", planId).select(PLAN_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateBudgetPlan: failed to update budget plan", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", plan: mapPlanRow(data) };
}

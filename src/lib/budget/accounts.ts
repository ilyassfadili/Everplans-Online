import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetAccount, BudgetAccountType } from "@/types/budget";

/**
 * Budget Planner financial accounts - `public.budget_accounts` (Everplans
 * Money Prompt 1's "Accounts foundation": manual organization only, never a
 * bank integration or a synced balance). Same shape as `@/lib/budget/categories`:
 * every function calls `requireUser()` itself, and RLS (a join back to
 * `budget_plans.owner_id`) independently enforces the same "only this plan's
 * owner" boundary.
 */

const ACCOUNT_COLUMNS = "id, plan_id, name, type, is_archived, sort_order, created_at, updated_at";

type AccountRow = {
  id: string;
  plan_id: string;
  name: string;
  type: string;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapAccountRow(row: AccountRow): BudgetAccount {
  return {
    id: row.id,
    planId: row.plan_id,
    name: row.name,
    // Cast, not re-validated: `budget_accounts_type_valid` (the migration)
    // already guarantees the database can never hold anything outside this
    // union - same convention `@/lib/budget/categories` uses for `group_label`.
    type: row.type as BudgetAccountType,
    isArchived: row.is_archived,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Active (non-archived) accounts, in display order - the set every account picker (Income, Expenses, Transactions add/edit forms) reads. */
export async function getAccountsForPlan(planId: string): Promise<BudgetAccount[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("plan_id", planId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getAccountsForPlan: failed to load accounts", error);
    return [];
  }

  return (data ?? []).map(mapAccountRow);
}

/** Every account regardless of archived state - the set anything *displaying* an already-assigned account (an expense's badge) must read from, so an archived account's name keeps resolving. Never used to populate an account *picker*. */
export async function getAllAccountsForPlan(planId: string): Promise<BudgetAccount[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getAllAccountsForPlan: failed to load accounts", error);
    return [];
  }

  return (data ?? []).map(mapAccountRow);
}

/** Archived accounts only - the Accounts page's own "Archived" section, so an account can be found and restored again. */
export async function getArchivedAccountsForPlan(planId: string): Promise<BudgetAccount[]> {
  const all = await getAllAccountsForPlan(planId);
  return all.filter((account) => account.isArchived);
}

const accountTypeSchema = z.enum(["checking", "savings", "cash", "credit-card", "other"]);

const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Give this account a name.").max(100, "Keep it under 100 characters."),
  type: accountTypeSchema.optional().default("checking"),
});

export type CreateBudgetAccountInput = z.input<typeof createAccountSchema>;

export type BudgetAccountMutationResult =
  | { status: "success"; account: BudgetAccount }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createAccount(planId: string, input: CreateBudgetAccountInput): Promise<BudgetAccountMutationResult> {
  await requireUser();

  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("budget_accounts")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  const { data, error } = await supabase
    .from("budget_accounts")
    .insert({
      plan_id: planId,
      name: parsed.data.name,
      type: parsed.data.type,
      sort_order: count ?? 0,
    })
    .select(ACCOUNT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createAccount: failed to create account", error);
    return { status: "error", message: "Couldn't add that account. Please try again." };
  }

  return { status: "success", account: mapAccountRow(data) };
}

const updateAccountSchema = z.object({
  name: z.string().trim().min(1, "Give this account a name.").max(100, "Keep it under 100 characters.").optional(),
  type: accountTypeSchema.optional(),
});

export type UpdateBudgetAccountInput = z.input<typeof updateAccountSchema>;

export async function updateAccount(accountId: string, input: UpdateBudgetAccountInput): Promise<BudgetAccountMutationResult> {
  await requireUser();

  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; type?: BudgetAccountType } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.type !== undefined) patch.type = parsed.data.type;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("budget_accounts")
    .update(patch)
    .eq("id", accountId)
    .select(ACCOUNT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateAccount: failed to update account", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", account: mapAccountRow(data) };
}

export type DeleteBudgetAccountResult = { status: "success" } | { status: "error"; message: string };

/**
 * Archives an account rather than deleting it - the same "never silently
 * orphan financial history" reasoning `archiveCategory` documents. Expenses,
 * income entries, and recurring items that reference it keep working; they
 * simply stop seeing it in active account pickers (`getAccountsForPlan` only
 * returns non-archived rows).
 */
export async function archiveAccount(accountId: string): Promise<DeleteBudgetAccountResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_accounts").update({ is_archived: true }).eq("id", accountId);

  if (error) {
    console.error("archiveAccount: failed to archive account", error);
    return { status: "error", message: "Couldn't remove that account. Please try again." };
  }

  return { status: "success" };
}

/** Brings an archived account back into active pickers - the undo side of `archiveAccount`. */
export async function restoreAccount(accountId: string): Promise<DeleteBudgetAccountResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("budget_accounts").update({ is_archived: false }).eq("id", accountId);

  if (error) {
    console.error("restoreAccount: failed to restore account", error);
    return { status: "error", message: "Couldn't restore that account. Please try again." };
  }

  return { status: "success" };
}

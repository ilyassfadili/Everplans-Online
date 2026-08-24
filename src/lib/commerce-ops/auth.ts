import "server-only";

import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * The commerce-operator authorization boundary (Everplans Money Prompt 7
 * Phase 1) - "normal customer" vs. "authorized Everplans commerce
 * operator," decided exclusively server-side. `public.commerce_operators`
 * (see its own migration comment) has RLS enabled with ZERO policies for
 * `anon`/`authenticated` - there is no row about operator status any
 * signed-in session could ever read or write about itself through the
 * ordinary publishable-key clients, so this check can only ever be
 * performed with the service-role client, and only from `server-only`
 * code. This is what makes "a normal customer cannot become an operator by
 * changing a role value in the browser" a structural fact, not a
 * convention this file has to enforce alone.
 */
export async function isCommerceOperator(userId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.from("commerce_operators").select("user_id").eq("user_id", userId).maybeSingle();

  if (error) {
    console.error("isCommerceOperator: failed to check operator status", error);
    // Fails closed - a database error is never treated as "is an
    // operator," the same "never infer access from an uncertain check"
    // principle `getActiveEntitlement` follows for product access.
    return false;
  }

  return data !== null;
}

/**
 * For every commerce-ops Server Component page: resolves the authenticated
 * user, then requires operator status, or renders this route's `not-found`
 * (never a 403/redirect-to-sign-in-flavored response) - a non-operator
 * hitting an ops URL directly sees exactly what they'd see for a URL that
 * doesn't exist at all, revealing nothing about whether commerce-ops
 * functionality exists, let alone why they can't reach it. Every ops page
 * must call this before reading or rendering anything operator-only.
 */
export async function requireCommerceOperator(): Promise<User> {
  const user = await requireUser();

  if (!(await isCommerceOperator(user.id))) {
    notFound();
  }

  return user;
}

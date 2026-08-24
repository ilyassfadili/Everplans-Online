import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { CommerceOpsAuditLogEntry } from "@/types/commerce-ops";

/**
 * The commerce-ops audit trail - `public.commerce_ops_audit_log` (Everplans
 * Money Prompt 7 Phase 4: "important commerce administrative actions
 * should be traceable"). Minimal by design: operator, action, target,
 * result, timestamp, small safe metadata - never a secret, never a raw
 * provider payload. Every operational Server Action that changes or
 * re-verifies anything calls `logCommerceOpsAction` after the fact, success
 * or failure alike, so the log reflects what actually happened, not just
 * what was attempted.
 */

export interface LogCommerceOpsActionInput {
  operatorId: string;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  metadata?: Record<string, unknown>;
}

export async function logCommerceOpsAction(input: LogCommerceOpsActionInput): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from("commerce_ops_audit_log").insert({
    operator_id: input.operatorId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    result: input.result,
    metadata: input.metadata ?? {},
  });

  if (error) {
    // Never blocks the operational action itself over a logging failure -
    // the same "visibility must not gate real processing" principle
    // `recordWebhookEventReceived` follows.
    console.error("logCommerceOpsAction: failed to record audit log entry", error);
  }
}

function mapAuditLogRow(row: {
  id: string;
  operator_id: string;
  action: string;
  target_type: string;
  target_id: string;
  result: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}): CommerceOpsAuditLogEntry {
  return {
    id: row.id,
    operatorId: row.operator_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    result: row.result,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

/** Audit entries for one specific target (e.g. an order) - the Order Detail view's own "what has an operator done to this order" read. */
export async function getAuditLogForTarget(targetType: string, targetId: string): Promise<CommerceOpsAuditLogEntry[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("commerce_ops_audit_log")
    .select("id, operator_id, action, target_type, target_id, result, metadata, created_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAuditLogForTarget: failed to load audit log", error);
    return [];
  }

  return (data ?? []).map(mapAuditLogRow);
}

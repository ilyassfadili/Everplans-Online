import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RelatedEntityRef, RelatedEntityType, WeddingDecision, WeddingDecisionStatus } from "@/types/wedding";

/**
 * Wedding Planner decisions - `public.wedding_decisions`
 * (`supabase/migrations/20260830000000_wedding_notes_decisions_documents.sql`).
 * Same shape as `@/lib/wedding/notes` - a lightweight record of an
 * important choice, not a corporate decision-management workflow (Phase
 * 3's own framing).
 */

const DECISION_COLUMNS = "id, wedding_id, title, description, status, related_entity_type, related_entity_id, created_at, updated_at";

type DecisionRow = {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  status: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapRelatedEntity(type: string | null, id: string | null): RelatedEntityRef | null {
  if (!type || !id) return null;
  return { type: type as RelatedEntityType, id };
}

function mapDecisionRow(row: DecisionRow): WeddingDecision {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    title: row.title,
    description: row.description,
    status: row.status as WeddingDecisionStatus,
    relatedEntity: mapRelatedEntity(row.related_entity_type, row.related_entity_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDecisionsForWedding(weddingId: string): Promise<WeddingDecision[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_decisions")
    .select(DECISION_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDecisionsForWedding: failed to load decisions", error);
    return [];
  }

  return (data ?? []).map(mapDecisionRow);
}

const relatedEntityTypeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));
const relatedEntityIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const createDecisionSchema = z.object({
  title: z.string().trim().min(1, "Give this decision a title.").max(150, "Keep it under 150 characters."),
  description: z.string().trim().max(2000, "Keep it under 2000 characters.").optional().transform((value) => (value ? value : null)),
  relatedEntityType: relatedEntityTypeSchema,
  relatedEntityId: relatedEntityIdSchema,
});

export type CreateDecisionInput = z.input<typeof createDecisionSchema>;

export type DecisionMutationResult =
  | { status: "success"; decision: WeddingDecision }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function createDecision(weddingId: string, input: CreateDecisionInput): Promise<DecisionMutationResult> {
  await requireUser();

  const parsed = createDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const relatedEntityType = parsed.data.relatedEntityId ? parsed.data.relatedEntityType : null;
  const relatedEntityId = parsed.data.relatedEntityType ? parsed.data.relatedEntityId : null;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_decisions")
    .insert({
      wedding_id: weddingId,
      title: parsed.data.title,
      description: parsed.data.description,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
    })
    .select(DECISION_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createDecision: failed to create decision", error);
    return { status: "error", message: "Couldn't add that decision. Please try again." };
  }

  return { status: "success", decision: mapDecisionRow(data) };
}

const updateDecisionSchema = z.object({
  title: z.string().trim().min(1, "Give this decision a title.").max(150, "Keep it under 150 characters.").optional(),
  description: z.string().trim().max(2000, "Keep it under 2000 characters.").optional(),
  status: z.enum(["open", "decided"]).optional(),
});

export type UpdateDecisionInput = z.input<typeof updateDecisionSchema>;

export async function updateDecision(decisionId: string, input: UpdateDecisionInput): Promise<DecisionMutationResult> {
  await requireUser();

  const parsed = updateDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { title?: string; description?: string; status?: string } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.description !== undefined) patch.description = parsed.data.description;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("wedding_decisions").update(patch).eq("id", decisionId).select(DECISION_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateDecision: failed to update decision", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", decision: mapDecisionRow(data) };
}

export type DeleteDecisionResult = { status: "success" } | { status: "error"; message: string };

export async function deleteDecision(decisionId: string): Promise<DeleteDecisionResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wedding_decisions").delete().eq("id", decisionId);

  if (error) {
    console.error("deleteDecision: failed to delete decision", error);
    return { status: "error", message: "Couldn't remove that decision. Please try again." };
  }

  return { status: "success" };
}

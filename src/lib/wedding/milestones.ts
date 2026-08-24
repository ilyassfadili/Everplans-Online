import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeddingMilestone, WeddingPlanningStatus } from "@/types/wedding";

/**
 * Wedding Planner milestones - `public.wedding_milestones`
 * (`supabase/migrations/20260824000000_wedding_planning_core.sql`). Same
 * shape as `@/lib/wedding/weddings`: every function calls `requireUser()`
 * itself, and RLS (a join back to `weddings.owner_id`) is the independent
 * second enforcement of "only this wedding's owner can see or touch its
 * milestones" - a `weddingId` for someone else's workspace simply resolves
 * to zero rows or a rejected write, never another user's data.
 */

const MILESTONE_COLUMNS = "id, wedding_id, title, description, status, target_date, sort_order, created_at, updated_at";

type MilestoneRow = {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapMilestoneRow(row: MilestoneRow): WeddingMilestone {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    title: row.title,
    description: row.description,
    // Cast, not re-validated: `wedding_milestones_status_valid` (the
    // migration) already guarantees the database can never hold anything
    // outside this union.
    status: row.status as WeddingPlanningStatus,
    targetDate: row.target_date,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * All of a wedding's milestones, ordered the way they were created
 * (`sort_order`) - the order the couple built their own plan in, not an
 * incidental database order.
 */
export async function getMilestonesForWedding(weddingId: string): Promise<WeddingMilestone[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_milestones")
    .select(MILESTONE_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getMilestonesForWedding: failed to load milestones", error);
    return [];
  }

  return (data ?? []).map(mapMilestoneRow);
}

const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Give this milestone a title.").max(150, "Keep it under 150 characters."),
  targetDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

export type CreateMilestoneInput = z.input<typeof createMilestoneSchema>;

export type MilestoneMutationResult =
  | { status: "success"; milestone: WeddingMilestone }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Appends a new milestone to the end of the wedding's list. `sort_order` is
 * assigned here, not by the database, as "one more than however many
 * already exist" - good enough for append-only creation (there's no
 * reordering UI yet), and simpler than a database sequence scoped per
 * wedding.
 */
export async function createMilestone(weddingId: string, input: CreateMilestoneInput): Promise<MilestoneMutationResult> {
  await requireUser();

  const parsed = createMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("wedding_milestones")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", weddingId);

  const { data, error } = await supabase
    .from("wedding_milestones")
    .insert({
      wedding_id: weddingId,
      title: parsed.data.title,
      target_date: parsed.data.targetDate,
      sort_order: count ?? 0,
    })
    .select(MILESTONE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createMilestone: failed to create milestone", error);
    return { status: "error", message: "Couldn't add that milestone. Please try again." };
  }

  return { status: "success", milestone: mapMilestoneRow(data) };
}

/**
 * Advances or reopens a milestone - the fast, single-purpose action behind
 * a status control, distinct from editing its title/description/date
 * (there's no combined "edit everything" form for milestones today, since
 * status is the one thing the dashboard's own milestone list lets someone
 * change in place).
 */
export async function updateMilestoneStatus(
  milestoneId: string,
  status: WeddingPlanningStatus,
): Promise<MilestoneMutationResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wedding_milestones")
    .update({ status })
    .eq("id", milestoneId)
    .select(MILESTONE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateMilestoneStatus: failed to update milestone", error);
    return { status: "error", message: "Couldn't update that milestone. Please try again." };
  }

  return { status: "success", milestone: mapMilestoneRow(data) };
}

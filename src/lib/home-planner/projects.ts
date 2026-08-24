import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project, ProjectCategory, ProjectStatus } from "@/types/home-planner";

/**
 * Home Planner projects - `public.home_projects`
 * (`supabase/migrations/20260910000009_home_projects.sql`). Same shape as
 * `@/lib/home-planner/rooms`/`@/lib/home-planner/maintenance`: every
 * function calls `requireUser()` itself, and RLS (a join back to
 * `homes.owner_id`) independently enforces the same boundary.
 */

const PROJECT_COLUMNS =
  "id, home_id, room_id, name, description, category, status, start_date, target_completion_date, budget_planned_cents, budget_used_cents, notes, created_at, updated_at";

const CATEGORIES = [
  "renovation",
  "repair",
  "decoration",
  "furniture",
  "garden",
  "improvement",
  "other",
] as const satisfies readonly ProjectCategory[];

const STATUSES = ["planning", "in_progress", "on_hold", "completed"] as const satisfies readonly ProjectStatus[];

type ProjectRow = {
  id: string;
  home_id: string;
  room_id: string | null;
  name: string;
  description: string | null;
  category: string;
  status: string;
  start_date: string | null;
  target_completion_date: string | null;
  budget_planned_cents: number | null;
  budget_used_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    homeId: row.home_id,
    roomId: row.room_id,
    name: row.name,
    description: row.description,
    // Cast, not re-validated: `home_projects_category_valid`/`_status_valid`
    // (the migration) already guarantee the database can never hold
    // anything outside these unions.
    category: row.category as ProjectCategory,
    status: row.status as ProjectStatus,
    startDate: row.start_date,
    targetCompletionDate: row.target_completion_date,
    budgetPlannedCents: row.budget_planned_cents,
    budgetUsedCents: row.budget_used_cents,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProjectsForHome(homeId: string): Promise<Project[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_projects")
    .select(PROJECT_COLUMNS)
    .eq("home_id", homeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProjectsForHome: failed to load projects", error);
    return [];
  }

  return (data ?? []).map(mapProjectRow);
}

export async function getProjectById(homeId: string, projectId: string): Promise<Project | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_projects")
    .select(PROJECT_COLUMNS)
    .eq("id", projectId)
    .eq("home_id", homeId)
    .maybeSingle();

  if (error) {
    console.error("getProjectById: failed to load project", error);
    return null;
  }

  return data ? mapProjectRow(data) : null;
}

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const optionalIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const optionalCentsSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a valid amount." });
      return z.NEVER;
    }
    return Math.round(parsed * 100);
  });

const projectSchema = z.object({
  name: z.string().trim().min(1, "Enter a project name.").max(150, "Keep it under 150 characters."),
  description: optionalTextSchema(1000, "Keep it under 1000 characters."),
  category: z.enum(CATEGORIES, { message: "Choose a category." }),
  status: z.enum(STATUSES, { message: "Choose a status." }),
  roomId: optionalIdSchema,
  startDate: optionalTextSchema(10, "Enter a valid date."),
  targetCompletionDate: optionalTextSchema(10, "Enter a valid date."),
  budgetPlannedDollars: optionalCentsSchema,
  budgetUsedDollars: optionalCentsSchema,
  notes: optionalTextSchema(2000, "Keep it under 2000 characters."),
});

export type ProjectInput = z.input<typeof projectSchema>;

export type ProjectMutationResult =
  | { status: "success"; project: Project }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/** Project creation (Phase 3: "do not build a complete accounting system") - name, category, status, optional room/dates/budget/notes. */
export async function createProject(homeId: string, input: ProjectInput): Promise<ProjectMutationResult> {
  await requireUser();

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_projects")
    .insert({
      home_id: homeId,
      room_id: parsed.data.roomId,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      status: parsed.data.status,
      start_date: parsed.data.startDate,
      target_completion_date: parsed.data.targetCompletionDate,
      budget_planned_cents: parsed.data.budgetPlannedDollars,
      budget_used_cents: parsed.data.budgetUsedDollars,
      notes: parsed.data.notes,
    })
    .select(PROJECT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createProject: failed to create project", error);
    return { status: "error", message: "Couldn't create that project. Please try again." };
  }

  return { status: "success", project: mapProjectRow(data) };
}

/** Edits a project - ships every field editable from day one. */
export async function updateProject(projectId: string, input: ProjectInput): Promise<ProjectMutationResult> {
  await requireUser();

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("home_projects")
    .update({
      room_id: parsed.data.roomId,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      status: parsed.data.status,
      start_date: parsed.data.startDate,
      target_completion_date: parsed.data.targetCompletionDate,
      budget_planned_cents: parsed.data.budgetPlannedDollars,
      budget_used_cents: parsed.data.budgetUsedDollars,
      notes: parsed.data.notes,
    })
    .eq("id", projectId)
    .select(PROJECT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateProject: failed to update project", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  return { status: "success", project: mapProjectRow(data) };
}

export type DeleteProjectResult = { status: "success" } | { status: "error"; message: string };

export async function deleteProject(projectId: string): Promise<DeleteProjectResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("home_projects").delete().eq("id", projectId);

  if (error) {
    console.error("deleteProject: failed to delete project", error);
    return { status: "error", message: "Couldn't remove that project. Please try again." };
  }

  return { status: "success" };
}

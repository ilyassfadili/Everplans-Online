import "server-only";

import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LIFE_AREA_COLOR_KEYS, LIFE_AREA_ICON_KEYS, type LifeArea, type LifeAreaColorKey, type LifeAreaIconKey } from "@/types/life-planner";

/**
 * Life Areas - `public.life_areas`
 * (`supabase/migrations/20260912000000_life_planner_areas.sql`), the first
 * child table of `public.life_plans`. Same shape as `@/lib/budget/categories`
 * (the closest existing "user-owned, position-ordered list of small
 * records" DAL): every exported function calls `requireUser()` itself, and
 * RLS (a direct `owner_id = auth.uid()` policy, since this table carries
 * its own `owner_id` rather than needing a join like a wedding/travel child
 * table) independently enforces "only this user's own areas."
 *
 * `server-only`: reads/writes `public.life_areas` through the server
 * Supabase client. Never safe to import from a Client Component.
 */

const AREA_COLUMNS = "id, owner_id, plan_id, name, description, icon_key, color_key, is_custom, position, created_at, updated_at";

type LifeAreaRow = {
  id: string;
  owner_id: string;
  plan_id: string;
  name: string;
  description: string | null;
  icon_key: string;
  color_key: string;
  is_custom: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

function mapLifeAreaRow(row: LifeAreaRow): LifeArea {
  return {
    id: row.id,
    ownerId: row.owner_id,
    planId: row.plan_id,
    name: row.name,
    description: row.description,
    // Cast, not re-validated: every row this DAL ever inserts goes through
    // `iconKeySchema`/`colorKeySchema` first, so the database can never
    // hold anything outside these unions in practice - same convention
    // `mapCategoryRow` (`@/lib/budget/categories`) applies to its own
    // `group`/`kind` columns.
    iconKey: row.icon_key as LifeAreaIconKey,
    colorKey: row.color_key as LifeAreaColorKey,
    isCustom: row.is_custom,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Every Life Area the current user has, in `position` order - the order
 * they were seeded/added in, and the order every view (the dedicated Areas
 * page, the dashboard's compact preview) renders them in.
 */
export async function getLifeAreasForCurrentUser(): Promise<LifeArea[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("life_areas")
    .select(AREA_COLUMNS)
    .eq("owner_id", user.id)
    .order("position", { ascending: true });

  if (error) {
    console.error("getLifeAreasForCurrentUser: failed to load life areas", error);
    return [];
  }

  return (data ?? []).map(mapLifeAreaRow);
}

// The 9 default areas (Prompt 2 Phase 1's own spec) - name, icon, and color
// chosen so every default reads distinctly even though the color system
// only has 6 tints to draw from (`LIFE_AREA_COLOR_KEYS`): no two adjacent
// defaults share a color, and the two "growth" areas (Finance, Travel) both
// read `success` on purpose - saving toward a goal and getting to travel are
// both a positive, forward outcome in this app's register.
const DEFAULT_LIFE_AREAS: readonly { name: string; iconKey: LifeAreaIconKey; colorKey: LifeAreaColorKey }[] = [
  { name: "Personal", iconKey: "personal", colorKey: "neutral" },
  { name: "Career", iconKey: "career", colorKey: "brand" },
  { name: "Education", iconKey: "education", colorKey: "accent" },
  { name: "Finance", iconKey: "finance", colorKey: "success" },
  { name: "Health & Wellness", iconKey: "health", colorKey: "warning" },
  { name: "Relationships", iconKey: "relationships", colorKey: "brand" },
  { name: "Home", iconKey: "home", colorKey: "accent" },
  { name: "Travel", iconKey: "travel", colorKey: "success" },
  { name: "Other", iconKey: "other", colorKey: "neutral" },
];

/**
 * Verifies `planId` belongs to the current user before letting a Life Area
 * reference it - `life_areas`' own insert policy only checks the new row's
 * own `owner_id`, not that a caller-supplied `plan_id` actually belongs to
 * that same owner, so an unverified id would let a signed-in user file an
 * area under any plan id they can guess (and since `plan_id` is `on delete
 * cascade` against `life_plans`, a stray cross-owner reference would also
 * leave this area vulnerable to being deleted the moment a *different*
 * user's plan is ever removed). Same "caller-supplied id, unverified by the
 * table's own insert policy" guard `verifyLifeAreaOwnership`
 * (`@/lib/life-planner/life-tasks`) documents for its own caller-supplied
 * id, one level up.
 */
async function verifyLifePlanOwnership(planId: string, ownerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("life_plans").select("id").eq("id", planId).eq("owner_id", ownerId).maybeSingle();

  if (error) {
    console.error("verifyLifePlanOwnership: failed to check life plan", error);
    return false;
  }

  return data !== null;
}

/**
 * Seeds the 9 default Life Areas for `planId`, but only the very first time
 * - idempotent by checking the user's own row count first, not by any
 * database constraint (there's no uniqueness on name; a user is free to
 * end up with two areas called the same thing later by editing one, and
 * that's fine). Meant to be called once, right after a Life Planner route
 * has confirmed `getLifePlanForCurrentUser()` returns non-`null` - the same
 * "auto-provision on first real visit" moment `createLifePlan` itself
 * follows, just one level down.
 *
 * Seeded rows are `is_custom: false` - they came from onboarding, not a
 * user typing a name into the "add area" form - though nothing today
 * actually restricts what a user can do to a non-custom row (see
 * `deleteLifeArea`'s own comment).
 */
export async function ensureDefaultLifeAreas(planId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("life_areas")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (countError) {
    console.error("ensureDefaultLifeAreas: failed to check existing life areas", countError);
    return;
  }

  if (count && count > 0) {
    return;
  }

  if (!(await verifyLifePlanOwnership(planId, user.id))) {
    console.error("ensureDefaultLifeAreas: planId does not belong to the current user");
    return;
  }

  const { error: insertError } = await supabase.from("life_areas").insert(
    DEFAULT_LIFE_AREAS.map((area, index) => ({
      owner_id: user.id,
      plan_id: planId,
      name: area.name,
      icon_key: area.iconKey,
      color_key: area.colorKey,
      is_custom: false,
      position: index,
    })),
  );

  if (insertError) {
    // A `23505`/race (two tabs hitting this at once) is the only expected
    // failure mode here, and it's harmless to just drop - whichever request
    // won left the user with a full, correct default set either way, the
    // same "treat a duplicate race as already-succeeded" reasoning
    // `createLifePlan` applies to its own unique-violation case.
    console.error("ensureDefaultLifeAreas: failed to seed default life areas", insertError);
  }
}

const iconKeySchema = z.enum(LIFE_AREA_ICON_KEYS);
const colorKeySchema = z.enum(LIFE_AREA_COLOR_KEYS);

const descriptionSchema = z
  .string()
  .trim()
  .max(300, "Keep it under 300 characters.")
  .optional()
  .transform((value) => (value ? value : null));

const createLifeAreaSchema = z.object({
  name: z.string().trim().min(1, "Give this area a name.").max(60, "Keep it under 60 characters."),
  description: descriptionSchema,
  iconKey: iconKeySchema.optional().default("other"),
  colorKey: colorKeySchema.optional().default("neutral"),
});

export type CreateLifeAreaInput = z.input<typeof createLifeAreaSchema>;

export type LifeAreaMutationResult =
  | { status: "success"; area: LifeArea }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Appends a new custom Life Area to the end of the user's list - the "add
 * area" form's action. `planId` is a caller-supplied parameter (not
 * inferred from the current user the way `updateLifePlan` infers its own
 * row) because a user's `life_plans` row - and therefore its id - isn't
 * something this DAL re-derives on every call; the caller already has it
 * from `getLifePlanForCurrentUser()`, the same shape `createActivity`
 * (`@/lib/travel/activities`) takes a `tripId` for the same reason.
 */
export async function createLifeArea(planId: string, input: CreateLifeAreaInput): Promise<LifeAreaMutationResult> {
  const user = await requireUser();

  const parsed = createLifeAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  if (!(await verifyLifePlanOwnership(planId, user.id))) {
    return { status: "error", message: "That Life Plan no longer exists." };
  }

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase.from("life_areas").select("id", { count: "exact", head: true }).eq("owner_id", user.id);

  const { data, error } = await supabase
    .from("life_areas")
    .insert({
      owner_id: user.id,
      plan_id: planId,
      name: parsed.data.name,
      description: parsed.data.description,
      icon_key: parsed.data.iconKey,
      color_key: parsed.data.colorKey,
      is_custom: true,
      position: count ?? 0,
    })
    .select(AREA_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createLifeArea: failed to create life area", error);
    return { status: "error", message: "Couldn't add that area. Please try again." };
  }

  return { status: "success", area: mapLifeAreaRow(data) };
}

const updateLifeAreaSchema = z.object({
  name: z.string().trim().min(1, "Give this area a name.").max(60, "Keep it under 60 characters.").optional(),
  description: descriptionSchema,
  iconKey: iconKeySchema.optional(),
  colorKey: colorKeySchema.optional(),
});

export type UpdateLifeAreaInput = z.input<typeof updateLifeAreaSchema>;

/**
 * Edits a Life Area in place - a partial patch (only the fields actually
 * present in `input` are written), the same "check presence on the raw
 * input, not the parsed output" shape `updateCategory`
 * (`@/lib/budget/categories`) uses so an edit that only touches `name`
 * can't accidentally null out an existing `description`.
 */
export async function updateLifeArea(areaId: string, input: UpdateLifeAreaInput): Promise<LifeAreaMutationResult> {
  const user = await requireUser();

  const parsed = updateLifeAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { name?: string; description?: string | null; icon_key?: LifeAreaIconKey; color_key?: LifeAreaColorKey } = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (Object.hasOwn(input, "description")) patch.description = parsed.data.description;
  if (parsed.data.iconKey !== undefined) patch.icon_key = parsed.data.iconKey;
  if (parsed.data.colorKey !== undefined) patch.color_key = parsed.data.colorKey;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("life_areas").update(patch).eq("id", areaId).eq("owner_id", user.id).select(AREA_COLUMNS).maybeSingle();

  if (error || !data) {
    console.error("updateLifeArea: failed to update life area", error);
    return { status: "error", message: "Couldn't save that change. Please try again." };
  }

  return { status: "success", area: mapLifeAreaRow(data) };
}

export type DeleteLifeAreaResult = { status: "success" } | { status: "error"; message: string };

/**
 * Deletes a Life Area outright (unlike Budget's `archiveCategory`, there's
 * no soft-delete/restore concept here yet - Prompt 2 Phase 1 has nothing
 * that references an area besides this table itself, so nothing is left
 * dangling). Deliberately allows deleting *any* area, default or custom -
 * `isCustom` is informational only, not an access-control flag, since a
 * default area a user doesn't want is just as removable as one they added
 * themselves.
 *
 * The one real safeguard: refuses to delete a user's last remaining area,
 * so `getLifeAreasForCurrentUser()` can never return `[]` for an account
 * that has ever had a plan - every future feature that hangs data off a
 * `life_area_id` (goals, tasks, habits - Prompts 2-3) can keep assuming
 * "there's always at least one area to file something under."
 */
export async function deleteLifeArea(areaId: string): Promise<DeleteLifeAreaResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("life_areas")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (countError) {
    console.error("deleteLifeArea: failed to check remaining life areas", countError);
    return { status: "error", message: "Couldn't remove that area. Please try again." };
  }

  if ((count ?? 0) <= 1) {
    return { status: "error", message: "You need at least one Life Area - add another before removing this one." };
  }

  const { error } = await supabase.from("life_areas").delete().eq("id", areaId).eq("owner_id", user.id);

  if (error) {
    console.error("deleteLifeArea: failed to delete life area", error);
    return { status: "error", message: "Couldn't remove that area. Please try again." };
  }

  return { status: "success" };
}

/**
 * Swaps one Life Area's `position` with its neighbor in the user's full
 * list (there's no grouping to stay within, unlike `moveCategory`
 * (`@/lib/budget/categories`), which scopes a move to categories sharing
 * the same `group_label` - every area lives in one flat, ordered list).
 * `direction: "up"` moves toward the start of the list.
 */
export async function moveLifeArea(areaId: string, direction: "up" | "down"): Promise<DeleteLifeAreaResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: areas, error: loadError } = await supabase
    .from("life_areas")
    .select("id, position")
    .eq("owner_id", user.id)
    .order("position", { ascending: true });

  if (loadError || !areas) {
    console.error("moveLifeArea: failed to load life areas", loadError);
    return { status: "error", message: "Couldn't reorder that area. Please try again." };
  }

  const currentIndex = areas.findIndex((area) => area.id === areaId);
  if (currentIndex === -1) {
    return { status: "error", message: "That area no longer exists." };
  }

  const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const neighbor = areas[neighborIndex];

  if (!neighbor) {
    // Already at the edge of the list - not an error, just nothing to do.
    return { status: "success" };
  }

  const current = areas[currentIndex]!;

  const [firstUpdate, secondUpdate] = await Promise.all([
    supabase.from("life_areas").update({ position: neighbor.position }).eq("id", current.id).eq("owner_id", user.id),
    supabase.from("life_areas").update({ position: current.position }).eq("id", neighbor.id).eq("owner_id", user.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    console.error("moveLifeArea: failed to swap position", firstUpdate.error ?? secondUpdate.error);
    return { status: "error", message: "Couldn't reorder that area. Please try again." };
  }

  return { status: "success" };
}

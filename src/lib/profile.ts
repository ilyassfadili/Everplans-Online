import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, ProfileDateFormat, ProfileLanguage, ProfileTimeFormat } from "@/types/profile";

/**
 * The application-level user-owned data-access layer - the "getUserProfile
 * / updateUserProfile" pattern PROMPT 4 Phase 2 §1 asks for, conceptually,
 * extended by the Settings prompt's Profile/Preferences/avatar needs.
 * Every exported function here is user-aware by construction, not by
 * convention: each calls `requireUser()` itself and reads/writes
 * `public.profiles` scoped to that resolved id, so there is no parameter a
 * caller could pass (or fail to pass) to make any of them act on someone
 * else's row. Postgres RLS (see
 * `supabase/migrations/20260819000001_profiles.sql` and
 * `20260821000000_profile_details.sql`) is the second, independent
 * enforcement of the same boundary - defense in depth, not a boundary that
 * exists in only one layer.
 *
 * `server-only`: reads/writes `public.profiles` (and, for `updateAvatar`,
 * the `avatars` Storage bucket) through the server Supabase client and
 * calls the (also server-only) auth DAL. Never safe to import from a
 * Client Component.
 */

const PROFILE_COLUMNS =
  "id, display_name, first_name, last_name, phone, avatar_url, language, date_format, time_format, created_at, updated_at";

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  language: string;
  date_format: string;
  time_format: string;
  created_at: string;
  updated_at: string;
};

/**
 * Self-heals a missing `profiles` row via the `ensure_profile_exists`
 * RPC (`supabase/migrations/20260905000000_profile_self_heal.sql`) -
 * every mutation below calls this immediately before its own `.update()`,
 * because an `update ... where id = auth.uid()` against a row that
 * doesn't exist matches zero rows silently (not an error), which is
 * exactly what an account created before the `profiles` table/trigger
 * existed looks like: every save "fails" with a generic message and no
 * way to recover. A plain client-side upsert isn't an option here -
 * `profiles` deliberately has no INSERT policy for `authenticated` (see
 * `20260819000001_profiles.sql`'s own comment) - so this goes through the
 * one `security definer` function allowed to create a row, scoped to the
 * caller's own id only. A failure here is logged, not thrown: the
 * `.update()` immediately after still runs and still fails with its own
 * clear message if the row genuinely couldn't be created, rather than
 * this helper silently swallowing a real problem.
 */
async function ensureProfileRow(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<void> {
  const { error } = await supabase.rpc("ensure_profile_exists");
  if (error) {
    console.error("ensureProfileRow: failed to ensure profile row exists", error);
  }
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    // Cast, not re-validated: `profiles_language_allowed`/
    // `profiles_date_format_allowed`/`profiles_time_format_allowed`
    // (the migration) already guarantee the database can never hold
    // anything outside these unions - re-checking here would just be a
    // second copy of the same constraint, drifting the day one changes.
    language: row.language as ProfileLanguage,
    dateFormat: row.date_format as ProfileDateFormat,
    timeFormat: row.time_format as ProfileTimeFormat,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns the current user's profile, or `null` if one somehow doesn't
 * exist yet (the signup trigger creates one for every new account - see
 * the migration - so this is a defensive case, not an expected one: an
 * account created before this migration was applied, for instance).
 * Redirects to sign-in via `requireUser()` if there's no session at all -
 * this function has no "unauthenticated" return value because that case
 * never reaches its own logic.
 */
export async function getUserProfile(): Promise<Profile | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();

  // A real database/network failure, not "no row" (maybeSingle already
  // returns `data: null` for that case without an error) - logged for
  // operators, never surfaced to the caller as anything more specific
  // than "no profile," so nothing about the failure mode leaks upward.
  if (error) {
    console.error("getUserProfile: failed to load profile", error);
    return null;
  }

  if (data) {
    return mapProfileRow(data);
  }

  // No row, no error - a legacy account created before the `profiles`
  // table/auto-create trigger existed (see `ensureProfileRow`'s own
  // comment). Self-heal once and re-read, rather than returning `null`
  // and leaving every page that reads a profile treat this account as
  // permanently profile-less.
  await ensureProfileRow(supabase);
  const retry = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  if (retry.error) {
    console.error("getUserProfile: failed to load profile after self-heal", retry.error);
    return null;
  }

  return retry.data ? mapProfileRow(retry.data) : null;
}

const updateProfileDetailsSchema = z.object({
  // Same shape as `sign-up/schema.ts`'s `fullName` field split in two -
  // free text a person typed, not a token to over-constrain. `trim()`
  // matches `profiles_first_name_length`/`profiles_last_name_length`'s
  // intent (rejects an all-whitespace value); `max(100)` matches those
  // same constraints so a rejected value never even reaches the database
  // round trip that would fail it.
  firstName: z.string().trim().min(1, "Enter your first name.").max(100, "Keep it under 100 characters."),
  lastName: z.string().trim().min(1, "Enter your last name.").max(100, "Keep it under 100 characters."),
  // Free text, not a strict phone-format regex - international formats
  // vary too widely for a single pattern to be worth the false rejections
  // it would cause; `profiles_phone_length` (the migration) is the only
  // real constraint. Optional: a blank value clears the field.
  phone: z
    .string()
    .trim()
    .max(32, "Keep it under 32 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

// `z.input`, not `z.infer`/`z.output`: `phone`'s `.transform()` means the
// schema's *output* type (`string | null`, already normalized) differs
// from what a caller should actually pass in (`string | undefined`, the
// raw pre-transform shape `updateProfileFormAction` reads off `FormData`).
// Typing this parameter as the output type would make `safeParse` below
// reject a caller correctly passing `undefined` for "no phone entered."
export type UpdateProfileDetailsInput = z.input<typeof updateProfileDetailsSchema>;

export type ProfileMutationResult =
  | { status: "success"; profile: Profile }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * The Profile section's "Save Changes" action - first/last name plus
 * phone, all three saved together (Settings §5: one Save action, not a
 * separate one per field). Authenticate-then-validate, not the reverse -
 * matches the sequence every protected operation in this codebase
 * follows (PROMPT 7 Phase 2 §9): an unauthenticated caller should never
 * get a response that depends on what they sent.
 */
export async function updateProfileDetails(input: UpdateProfileDetailsInput): Promise<ProfileMutationResult> {
  const user = await requireUser();

  const parsed = updateProfileDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const supabase = await createSupabaseServerClient();
  await ensureProfileRow(supabase);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone,
    })
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    // Raw Postgres/PostgREST error text never reaches the caller - same
    // allowlist-over-pass-through principle `getAuthErrorMessage` already
    // applies to Supabase Auth errors, applied here to Supabase database
    // errors instead.
    console.error("updateProfileDetails: failed to update profile", error);
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  if (!data) {
    // RLS silently returning zero rows (rather than a PostgREST error)
    // is exactly what a blocked cross-user write looks like - fails
    // closed here instead of assuming success from an empty response.
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }

  // `displayName` (derived from first/last name by the database trigger -
  // see `20260821000000_profile_details.sql`) is read by `(app)/layout.tsx`
  // on every route, not just this one - `DashboardSidebar`/`DashboardTopbar`/
  // `DashboardMobileNav` all render it. Revalidating the whole `layout`
  // segment (not just this page) is what makes a name change show up in
  // the sidebar/Header the moment this action resolves, without the
  // visitor having to navigate or reload for the shell to catch up - the
  // same live-feedback fix `updateAvatar` needs below, for the same
  // reason (live feedback: "it must be uploaded in the whole dashboard
  // without refreshing").
  revalidatePath("/app", "layout");

  return { status: "success", profile: mapProfileRow(data) };
}

const updateProfilePreferencesSchema = z
  .object({
    language: z.enum(["en"]).optional(),
    dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
    timeFormat: z.enum(["12h", "24h"]).optional(),
  })
  .refine((value) => value.language !== undefined || value.dateFormat !== undefined || value.timeFormat !== undefined, {
    message: "Nothing to update.",
  });

export type UpdateProfilePreferencesInput = z.infer<typeof updateProfilePreferencesSchema>;

/**
 * Preferences save one field at a time (Settings §9: "save automatically
 * for simple preferences") - the caller passes only the field that just
 * changed, and this updates only that column, leaving the other two
 * exactly as they were. Never all three unconditionally: a partial
 * `Update` object (built from only the keys actually present in `input`)
 * is what makes "change the date format" incapable of silently
 * overwriting a time format the caller's form never touched.
 */
export async function updateProfilePreferences(input: UpdateProfilePreferencesInput): Promise<ProfileMutationResult> {
  const user = await requireUser();

  const parsed = updateProfilePreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Check your input and try again." };
  }

  const patch: { language?: string; date_format?: string; time_format?: string } = {};
  if (parsed.data.language !== undefined) patch.language = parsed.data.language;
  if (parsed.data.dateFormat !== undefined) patch.date_format = parsed.data.dateFormat;
  if (parsed.data.timeFormat !== undefined) patch.time_format = parsed.data.timeFormat;

  const supabase = await createSupabaseServerClient();
  await ensureProfileRow(supabase);

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("updateProfilePreferences: failed to update profile", error);
    return { status: "error", message: "Couldn't save that. Please try again." };
  }

  if (!data) {
    return { status: "error", message: "Couldn't save that. Please try again." };
  }

  return { status: "success", profile: mapProfileRow(data) };
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function extensionForType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Uploads a new avatar to the `avatars` Storage bucket
 * (`supabase/migrations/20260821000000_profile_details.sql`) and points
 * `profiles.avatar_url` at its public URL. Validates real constraints
 * (type, size) before ever calling Storage - never a fake "upload
 * succeeded" state (Settings §3: "do not create fake upload success").
 *
 * Uploads through the caller's own session-scoped client, not the
 * privileged service client (`@/lib/supabase/service`) - Storage's own
 * RLS policies (the migration's "own folder only" checks) are the real
 * enforcement that this can only ever write under `avatars/{user.id}/`,
 * the same defense-in-depth relationship `updateProfileDetails` already
 * has with `profiles`' row-level policies. `upsert: true` with a fixed
 * filename (`avatar.<ext>`) means re-uploading replaces the previous
 * image at the same path rather than accumulating orphaned files per
 * user.
 *
 * Calls `ensureProfileRow` right before the `profiles` update, the same
 * self-heal every other mutation in this file applies - without it, an
 * account whose `profiles` row predates that table's own auto-create
 * trigger would have its image upload to Storage succeed and then this
 * function report a generic "saving failed" with no way to recover (see
 * `ensureProfileRow`'s own comment for the full story).
 */
export async function updateAvatar(file: File): Promise<ProfileMutationResult> {
  const user = await requireUser();

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { status: "invalid", message: "Upload a PNG, JPEG, or WebP image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { status: "invalid", message: "Images must be 5MB or smaller." };
  }

  const supabase = await createSupabaseServerClient();
  const path = `${user.id}/avatar.${extensionForType(file.type)}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

  if (uploadError) {
    console.error("updateAvatar: failed to upload image", uploadError);
    return { status: "error", message: "Couldn't upload your photo. Please try again." };
  }

  // A public bucket's public URL is deterministic and needs no round
  // trip - `cacheControl` above plus this cache-busting query param
  // together are what let the browser both cache the image normally and
  // still see a re-uploaded photo immediately, rather than the previous
  // one lingering until the cache naturally expires.
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  await ensureProfileRow(supabase);

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("updateAvatar: failed to save avatar URL", error);
    return { status: "error", message: "Your photo uploaded, but saving it failed. Please try again." };
  }

  // Same reasoning as `updateProfileDetails`'s own revalidation: the new
  // `avatarUrl` is read by `(app)/layout.tsx` on every route, and this
  // is what makes the sidebar/Header pick it up immediately (live
  // feedback: "it must be uploaded in the whole dashboard without
  // refreshing") rather than only on this page, and only after a manual
  // reload.
  revalidatePath("/app", "layout");

  return { status: "success", profile: mapProfileRow(data) };
}

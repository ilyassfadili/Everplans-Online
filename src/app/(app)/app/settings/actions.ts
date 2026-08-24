"use server";

import { z } from "zod";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { requireUser } from "@/lib/auth/dal";
import { updateAvatar, updateProfileDetails, updateProfilePreferences } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileDateFormat, ProfileLanguage, ProfileTimeFormat } from "@/types/profile";

/**
 * `/app/settings`'s own Server Actions - thin wrappers around the real
 * data-access functions in `@/lib/profile`, each adapting one form's
 * `FormData` (or, for Preferences, one changed value) into that
 * function's real input shape. The mutation logic itself - validation,
 * authentication order, RLS reliance - lives in `@/lib/profile`; nothing
 * here duplicates it.
 *
 * A local `min(8)` password rule is duplicated here rather than imported
 * from `(auth)/reset-password/schema.ts` - a one-line validation
 * constant is a small enough duplication that reaching across route
 * groups into another route's private folder (or refactoring that file
 * to extract a shared primitive, itself a change unrelated to this
 * prompt) would cost more than it saves. Promote it to a shared location
 * if a third caller ever needs the exact same rule.
 *
 * Each form's `useActionState` initial value (`{ status: "idle" }`) lives
 * in `./_components/form-state.ts`, not here - a `"use server"` file may
 * only export async functions ("A 'use server' file can only export
 * async functions, found object"), and those are plain object literals.
 * The `type`/`interface` exports below stay here regardless: they're
 * erased at compile time, so they're never a *runtime* export of this
 * module and don't trip that rule.
 */

export interface UpdateProfileFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
}

export async function updateProfileFormAction(
  _prevState: UpdateProfileFormState,
  formData: FormData,
): Promise<UpdateProfileFormState> {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");

  const result = await updateProfileDetails({
    firstName: typeof firstName === "string" ? firstName : "",
    lastName: typeof lastName === "string" ? lastName : "",
    phone: typeof phone === "string" ? phone : undefined,
  });

  if (result.status === "success") {
    return { status: "success", message: "Saved." };
  }
  return { status: result.status, message: result.message };
}

export interface UpdateAvatarFormState {
  status: "idle" | "success" | "invalid" | "error";
  message?: string;
  avatarUrl?: string | null;
}

export async function updateAvatarFormAction(
  _prevState: UpdateAvatarFormState,
  formData: FormData,
): Promise<UpdateAvatarFormState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "invalid", message: "Choose an image to upload." };
  }

  const result = await updateAvatar(file);
  if (result.status === "success") {
    return { status: "success", message: "Photo updated.", avatarUrl: result.profile.avatarUrl };
  }
  return { status: result.status, message: result.message };
}

export interface UpdatePreferenceState {
  status: "idle" | "success" | "error";
  message?: string;
}

/**
 * Called directly from `PreferencesForm` (not bound to a `<form>` -
 * there is no single "Preferences" submit, each control saves itself on
 * change per Settings §9). One field at a time: the caller passes only
 * whichever of the three changed, and `updateProfilePreferences` leaves
 * the other two untouched.
 */
export async function updatePreferenceAction(input: {
  language?: ProfileLanguage;
  dateFormat?: ProfileDateFormat;
  timeFormat?: ProfileTimeFormat;
}): Promise<UpdatePreferenceState> {
  const result = await updateProfilePreferences(input);
  if (result.status === "success") {
    return { status: "success" };
  }
  return { status: "error", message: result.message };
}

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});

export interface UpdatePasswordFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"password", string>>;
}

export async function updatePasswordFormAction(
  _prevState: UpdatePasswordFormState,
  formData: FormData,
): Promise<UpdatePasswordFormState> {
  // Authenticate first, then validate - the same sequence PROMPT 7
  // established and fixed `updateUserProfile`'s successor,
  // `updateProfileDetails`, to follow (see that file's own comment on
  // why an unauthenticated caller should never get a response that
  // depends on what they sent).
  await requireUser();

  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted field and try again.",
      fieldErrors: { password: parsed.error.issues[0]?.message },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: "error", message: getAuthErrorMessage(error.message) };
  }

  return { status: "success", message: "Your password has been updated." };
}

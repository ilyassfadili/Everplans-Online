"use client";

import { useActionState, useRef, useState } from "react";

import { AccountAvatar } from "@/app/(app)/_components/account-avatar";
import { Text } from "@/components/ui";
import { getAccountInitials } from "@/lib/account-display";

import { updateAvatarFormAction } from "../actions";
import { updateAvatarFormInitialState } from "./form-state";

interface AvatarUploadProps {
  avatarUrl: string | null;
  displayName: string | null;
  email?: string;
}

const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp";

/**
 * Profile section's photo control (Settings §3). Selecting a file submits
 * immediately - no separate "Upload" click needed once a file's chosen -
 * and the real states that follow (`isPending`/success/error) come
 * straight from `updateAvatarFormAction` (`../actions.ts`), which calls
 * the real `updateAvatar` (`@/lib/profile`). No fake success: until
 * `20260821000000_profile_details.sql`'s `avatars` bucket is applied to
 * the live project, this genuinely fails with a real error from Supabase
 * Storage, surfaced exactly as `state.message` below - never silently
 * swallowed or shown as if it worked.
 *
 * `AccountAvatar` (`@/app/(app)/_components/account-avatar`) is the same
 * shared image-or-initials circle `AccountMenu`/`UserProfileMenu` render
 * elsewhere in the shell - one "how do we represent this person" rule,
 * not a second one invented for this page's own preview.
 */
export function AvatarUpload({ avatarUrl, displayName, email }: AvatarUploadProps) {
  const [state, formAction, isPending] = useActionState(updateAvatarFormAction, updateAvatarFormInitialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const initials = getAccountInitials(displayName, email);
  const resolvedAvatarUrl = state.status === "success" ? (state.avatarUrl ?? null) : avatarUrl;
  const shownUrl = previewUrl ?? resolvedAvatarUrl;

  function handleFileChange() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-4">
      <AccountAvatar avatarUrl={shownUrl} initials={initials} className="size-16 text-h4" />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-line-strong px-4 text-body-sm font-medium text-ink transition-colors duration-150 ease-standard hover:bg-surface-muted">
            {isPending ? "Uploading…" : "Change photo"}
            <input
              ref={inputRef}
              type="file"
              name="avatar"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              disabled={isPending}
              className="sr-only"
            />
          </label>
        </div>
        {state.status === "invalid" || state.status === "error" ? (
          <Text size="caption" className="text-error">
            {state.message}
          </Text>
        ) : (
          <Text size="caption" tone="faint">
            PNG, JPEG, or WebP. Up to 5MB.
          </Text>
        )}
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";

import { Alert, Button, FormField, Stack, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";

import { updateProfileFormAction } from "../actions";
import { AvatarUpload } from "./avatar-upload";
import { updateProfileFormInitialState } from "./form-state";

interface ProfileSettingsFormProps {
  avatarUrl: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email?: string;
}

/**
 * The Profile section of `/app/settings` - real, working, wired to
 * `updateProfileFormAction` (`../actions.ts`), which calls the real
 * `updateProfileDetails` (`@/lib/profile`). First/last name plus phone
 * are separate fields now (`public.profiles` gained the columns to match
 * in `20260821000000_profile_details.sql`) - the previous single "Full
 * name" field is gone, not merely relabeled. Email is shown read-only:
 * it's Auth-owned identity data (`@/app/(app)/app/page.tsx`'s own
 * comment explains the split), and changing it needs Supabase's own
 * re-verification flow, not a plain text field.
 *
 * `AvatarUpload` is its own `<form>`/Server Action (see its own comment)
 * rendered above these fields - a different mutation with genuinely
 * different states (uploading a file vs. saving text fields), not
 * folded into this form's own submit.
 */
export function ProfileSettingsForm({
  avatarUrl,
  displayName,
  firstName,
  lastName,
  phone,
  email,
}: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileFormAction, updateProfileFormInitialState);

  return (
    <Stack gap="6">
      <AvatarUpload avatarUrl={avatarUrl} displayName={displayName} email={email} />

      <form action={formAction} noValidate>
        <Stack gap="5">
          {state.status === "success" && (
            <Alert variant="success" title="Saved">
              Your profile has been updated.
            </Alert>
          )}
          {(state.status === "error" || state.status === "invalid") && (
            <Alert variant="error" title="Couldn’t save your changes">
              {state.message}
            </Alert>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="First name" required>
              <Input name="firstName" defaultValue={firstName ?? ""} autoComplete="given-name" placeholder="Jane" />
            </FormField>
            <FormField label="Last name" required>
              <Input name="lastName" defaultValue={lastName ?? ""} autoComplete="family-name" placeholder="Doe" />
            </FormField>
          </div>

          <FormField label="Phone" hint="Optional.">
            <Input
              name="phone"
              type="tel"
              defaultValue={phone ?? ""}
              autoComplete="tel"
              placeholder="+1 (555) 000-0000"
            />
          </FormField>

          {email && (
            <div className="flex flex-col gap-1.5">
              <Text size="body-sm" weight="medium" className="text-ink">
                Email
              </Text>
              <Text size="body-sm" tone="muted">
                {email}
              </Text>
            </div>
          )}

          <Button type="submit" loading={isPending} className="self-start">
            Save changes
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

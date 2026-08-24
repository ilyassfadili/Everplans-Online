import { LogOut } from "lucide-react";

import { Icon, Text } from "@/components/ui";
import { signOut } from "@/lib/auth/actions";

import { PasswordSettingsForm } from "./password-settings-form";

/**
 * Account & Security's own two real actions (Settings §6): password
 * reset (`PasswordSettingsForm`, unchanged - already real, already
 * working) and sign out. Sign out reuses the exact same `signOut` Server
 * Action every other sign-out control in the app already calls
 * (`UserProfileMenu`, the Header's `AccountMenu`) - no second
 * authentication mechanism, no duplicated session logic.
 *
 * Visually distinct without dominating the section (Settings §7): the
 * same restrained `text-error` + `hover:bg-error-subtle` treatment
 * `UserProfileMenu`'s own sign-out button already established, not a
 * solid red block - a filled destructive button reads as "the primary
 * action of this page," which sign-out isn't.
 */
export function AccountSecuritySection() {
  return (
    <div className="flex flex-col gap-6">
      <PasswordSettingsForm />

      <div className="flex flex-col items-start gap-3 border-t border-line-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text as="p" weight="semibold">
            Sign out
          </Text>
          <Text size="body-sm" tone="muted" className="mt-0.5">
            Ends your session on this device.
          </Text>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex h-10 items-center gap-2 rounded-md border border-line-strong px-4 text-body-sm font-medium text-error transition-colors duration-150 ease-standard hover:border-error hover:bg-error-subtle"
          >
            <Icon icon={LogOut} size="sm" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

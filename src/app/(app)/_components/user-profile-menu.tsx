import { LogOut } from "lucide-react";

import { Icon } from "@/components/ui";
import { getAccountDisplayLabel, getAccountInitials } from "@/lib/account-display";
import { signOut } from "@/lib/auth/actions";

import { AccountAvatar } from "./account-avatar";

interface UserProfileMenuProps {
  /** From `public.profiles` (PROMPT 4) - `null` when unset, never a fake placeholder name. */
  displayName: string | null;
  /** From the Auth session directly - Auth-owned identity data, same split `@/app/(app)/app/page.tsx` already documents. */
  email?: string;
  /** From `public.profiles.avatar_url` (`updateAvatar`, `@/lib/profile`) - `null` before one's ever been uploaded. */
  avatarUrl?: string | null;
}

/**
 * The reusable "who's signed in, and how do they sign out" block - Phase
 * 1 §6's "user profile area," rendered identically in `DashboardSidebar`'s
 * footer (desktop) and `DashboardMobileNav`'s drawer footer (mobile),
 * rather than two components independently reinventing it. No dropdown
 * menu: everything this needs to show (identity + one action) fits as
 * plain, always-visible content, and a menu here would be an interaction
 * pattern this button doesn't need - "do not use ARIA unnecessarily when
 * native semantic HTML is sufficient" extends to not reaching for a
 * `role="menu"` where a plain button already does the job.
 *
 * Uses the existing `signOut` Server Action (`@/lib/auth/actions`) - the
 * same one the previous shell's header already used, and the same one
 * the Header's own `AccountMenu` now also calls. No second authentication
 * mechanism, no duplicated sign-out logic. Initials come from
 * `@/lib/account-display`, shared with `AccountMenu` for the same reason.
 */
export function UserProfileMenu({ displayName, email, avatarUrl = null }: UserProfileMenuProps) {
  const initials = getAccountInitials(displayName, email);
  const primaryLabel = getAccountDisplayLabel(displayName, email);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <AccountAvatar avatarUrl={avatarUrl} initials={initials} className="size-9 text-body-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-medium text-ink">{primaryLabel}</p>
          {email && <p className="truncate text-caption text-ink-faint">{email}</p>}
        </div>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-body-sm font-medium text-error transition-colors duration-150 ease-standard hover:bg-error-subtle"
        >
          <Icon icon={LogOut} size="sm" />
          Sign out
        </button>
      </form>
    </div>
  );
}

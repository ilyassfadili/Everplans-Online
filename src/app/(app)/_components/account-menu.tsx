"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui";
import { getAccountDisplayLabel, getAccountInitials } from "@/lib/account-display";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";

import { AccountAvatar } from "./account-avatar";

interface AccountMenuProps {
  displayName: string | null;
  email?: string;
  /** From `public.profiles.avatar_url` (`updateAvatar`, `@/lib/profile`) - `null` before one's ever been uploaded. */
  avatarUrl?: string | null;
  /** Avatar-only trigger, no name or chevron - `DashboardMobileNav`'s sticky bar (Header Prompt §11: mobile prefers "Avatar" alone over any wider treatment). */
  compact?: boolean;
}

/**
 * The Header's own account control (Header Prompt §2/§11) - a real
 * disclosure menu, distinct from `UserProfileMenu` (the sidebar/mobile-
 * drawer footer's always-visible identity block with one plain sign-out
 * button). The Header specifically asks for "avatar + chevron + account
 * menu," a different interaction shape than an always-open block, so this
 * is a second, small component rather than `UserProfileMenu` stretched to
 * cover both jobs - they share the same `signOut` Server Action and the
 * same initials/display-label helpers (`@/lib/account-display`) rather
 * than each deriving their own, so there is exactly one sign-out path and
 * one "how do we name this account" rule in the app.
 *
 * Same disclosure mechanics as `NotificationsMenu`/`DashboardSearch`
 * (click-outside, Escape, `aria-expanded`/`aria-controls`, a plain
 * `role="region"` panel of real links/buttons) - this codebase reaches
 * for ARIA menu semantics only where a native element can't already do
 * the job (see `UserProfileMenu`'s own comment on the same principle),
 * and a disclosure of one link plus one submit button doesn't need
 * `role="menu"`/roving `tabindex` to be fully keyboard-operable.
 *
 * The name + chevron are gated to `xl:` inside this component itself
 * (not via two separate call sites) - Header Prompt §11's "Laptop/Tablet:
 * Avatar + Chevron" down to "Desktop: Avatar + First Name + Chevron" is
 * one responsive rule belonging to one component, not two near-duplicate
 * ones drifting apart over time.
 */
export function AccountMenu({ displayName, email, avatarUrl = null, compact = false }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const initials = getAccountInitials(displayName, email);
  const primaryLabel = getAccountDisplayLabel(displayName, email);
  const badgeName = primaryLabel.split(" ")[0];

  function close() {
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex items-center gap-2 rounded-full text-ink-muted transition-colors duration-150 ease-standard hover:bg-surface-muted",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring/15",
          compact ? "size-10 justify-center" : "h-10 pl-1 pr-2 sm:pr-3",
        )}
      >
        <AccountAvatar avatarUrl={avatarUrl} initials={initials} className="size-9 text-body-sm" />
        {!compact && (
          <span className="hidden max-w-[7rem] truncate text-body-sm font-medium text-ink xl:inline">
            {badgeName}
          </span>
        )}
        {!compact && (
          <Icon
            icon={ChevronDown}
            size="sm"
            className={cn(
              "text-ink-faint transition-transform duration-150 ease-standard motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        )}
        <span className="sr-only">{open ? "Close account menu" : `Account menu for ${primaryLabel}`}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Account"
          className="absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-line-subtle bg-surface p-2 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-body-sm font-medium text-ink">{primaryLabel}</p>
            {email && <p className="truncate text-caption text-ink-faint">{email}</p>}
          </div>

          <div aria-hidden="true" className="my-1 border-t border-line-subtle" />

          <NextLink
            href="/app/settings"
            onClick={close}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-ink-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
          >
            <Icon icon={Settings} size="sm" />
            Account settings
          </NextLink>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm font-medium text-error transition-colors duration-150 ease-standard hover:bg-error-subtle"
            >
              <Icon icon={LogOut} size="sm" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

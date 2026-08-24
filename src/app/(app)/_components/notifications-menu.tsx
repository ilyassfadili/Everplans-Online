"use client";

import { Bell } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { Notification } from "@/types/notification";

interface NotificationsMenuProps {
  /** Fetched server-side in `DashboardTopbar` via `getNotifications()` - real data passed down, never fetched fake client-side. */
  notifications: Notification[];
}

/**
 * The desktop top bar's notification bell. `notifications` is real
 * (`@/lib/notifications`) and currently always `[]` - no notification-
 * producing system exists in the backend yet (that function's own
 * comment explains why) - so today this always renders the honest
 * "you're all caught up" empty state, never a fabricated badge count.
 * The populated branch below is real, exercised rendering logic waiting
 * on a real source, the same "real signature, honest empty today" shape
 * `ActivityTimeline`/`ResourceCard` already established - not
 * speculative code.
 *
 * Same disclosure mechanics as `DashboardSearch`'s panel (click-outside,
 * Escape) rather than a bespoke pattern per widget.
 */
export function NotificationsMenu({ notifications }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const unreadCount = notifications.filter((notification) => notification.readAt === null).length;

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

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative inline-flex size-10 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
      >
        <Icon icon={Bell} size="sm" />
        {unreadCount > 0 && <span aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-brand" />}
        <span className="sr-only">{unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          className="absolute right-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-line-subtle bg-surface p-2 shadow-xl"
        >
          {notifications.length === 0 ? (
            <p className="px-3 py-5 text-center text-body-sm text-ink-muted">
              You&rsquo;re all caught up - nothing new yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {notifications.map((notification) => {
                const content = (
                  <>
                    <span className="flex items-center gap-2">
                      {notification.readAt === null && (
                        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                      <span className="truncate text-body-sm font-medium text-ink">{notification.title}</span>
                    </span>
                    <span className="block text-caption text-ink-faint">{notification.body}</span>
                    <span className="block text-caption text-ink-faint">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </>
                );

                return (
                  <li key={notification.id}>
                    {notification.href ? (
                      <NextLink
                        href={notification.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-3 py-2 transition-colors duration-150 ease-standard hover:bg-surface-muted"
                      >
                        {content}
                      </NextLink>
                    ) : (
                      <div className="block rounded-md px-3 py-2">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

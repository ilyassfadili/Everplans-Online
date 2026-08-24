"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { APP_HOME_PATH } from "@/config/app";
import { authNav, primaryNav } from "@/config/navigation";
import { cn } from "@/lib/cn";

import { NavLink } from "./nav-link";

interface MobileMenuProps {
  /** Passed down from `Header` (a Server Component - this one can't call Supabase itself) so the panel's bottom CTA matches the desktop header instead of always showing Sign In/Sign Up. */
  isSignedIn: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The mobile navigation trigger + panel. A dropdown that drops down under
 * the still-visible header (brand stays put, trigger becomes a close
 * button) rather than a separate full-screen takeover - enough presence to
 * read as "menu mode," without losing the header's own context.
 *
 * Self-contained: owns its open state, traps focus while open, closes on
 * Escape or backdrop click, restores focus to the trigger on close, and
 * locks page scroll while open. Only rendered below the `lg` breakpoint -
 * see Header.
 */
export function MobileMenu({ isSignedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock background scroll while the menu is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the panel on open; trap Tab inside it; Escape closes.
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors duration-150 ease-standard hover:bg-surface-muted"
      >
        {open ? (
          <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
        )}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      {/*
        Always mounted (not `{open && ...}`) so both open AND close can
        transition smoothly via CSS - conditional rendering can only ever
        animate the entrance, since unmounting removes the element before
        any exit transition gets a frame to run. `inert` takes the closed
        panel out of tab order and hit-testing in one attribute, so it's
        safe to leave in the DOM without a manual focusability audit.
      */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
        inert={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-40 bg-overlay transition-opacity duration-200 ease-standard",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
        className={cn(
          "fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto",
          "border-t border-line-subtle bg-surface shadow-lg",
          "transition-[opacity,transform] duration-200 ease-standard motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <nav aria-label="Primary" className="flex flex-col px-6 py-6">
          <ul className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  onNavigate={close}
                  className="block rounded-md px-3 py-3 text-body hover:bg-surface-muted"
                />
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 border-t border-line-subtle pt-6">
            {isSignedIn ? (
              <Button href={APP_HOME_PATH} variant="primary" onClick={close}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button href={authNav.signIn.href} variant="outline" onClick={close}>
                  {authNav.signIn.label}
                </Button>
                <Button href={authNav.signUp.href} variant="primary" onClick={close}>
                  {authNav.signUp.label}
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

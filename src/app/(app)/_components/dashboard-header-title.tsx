"use client";

import { usePathname } from "next/navigation";

import { Heading } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getDashboardPageTitle } from "@/lib/dashboard-page-meta";

interface DashboardHeaderTitleProps {
  /**
   * `"mobile"` (the only real caller today, `DashboardMobileNav`'s sticky
   * bar): centered, between the menu trigger and account control.
   * `"desktop"` exists but is currently unused - the desktop Header
   * (`DashboardTopbar`) went back to carrying no title at all (live
   * feedback: "the title must not be in the header, must be like the old
   * version") in favor of `PageHeader`/`WorkspaceWelcome` owning the
   * title again on wide viewports - kept as a variant rather than deleted
   * in case a future desktop treatment wants it back.
   *
   * Title only, no section subtitle: the nav section a route belongs to
   * (Workspace/Discover/Support/Account) is already visible as the
   * sidebar's own group label (`DashboardNavSections`) - repeating it here
   * would be the same fact shown twice in the same view, not two
   * different pieces of information.
   */
  variant?: "desktop" | "mobile";
}

/**
 * `DashboardMobileNav`'s own "where am I" (Header Prompt §1/§14) - read
 * live off `usePathname()`, the same "only this needs the browser"
 * isolation `DashboardNavLink`/the public site's own `NavLink` already
 * establish elsewhere in this codebase.
 *
 * This is the real `<h1>` for every Dashboard route *below* `lg` only.
 * At `lg` and up, `DashboardMobileNav` (and this component with it) is
 * `display:none` - not part of the accessibility tree - and `PageHeader`/
 * `WorkspaceWelcome`'s own title in the page content (`hidden lg:block`,
 * the mirror image of this component's mobile-only visibility) takes
 * over as the real `<h1>` instead. Exactly one is ever visible/exposed to
 * assistive tech per viewport, never both at once.
 */
export function DashboardHeaderTitle({ variant = "desktop" }: DashboardHeaderTitleProps) {
  const pathname = usePathname();
  const title = getDashboardPageTitle(pathname);

  return (
    <Heading as="h1" size="h4" className={cn("min-w-0 truncate", variant === "mobile" && "text-center")}>
      {title}
    </Heading>
  );
}

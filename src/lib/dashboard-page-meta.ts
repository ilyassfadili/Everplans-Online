import { dashboardPageTitles } from "@/config/dashboard-page-meta";

const HOME_TITLE = dashboardPageTitles["/app"]!;

/**
 * Resolves the current route to the Header's title system (Header Prompt
 * §14) - the one place a pathname becomes "what the Header should show,"
 * so `DashboardHeaderTitle` (desktop and mobile alike) never has to
 * duplicate this matching logic.
 *
 * Prefix-matches like `DashboardNavLink` already does for the sidebar's
 * own active-route state (`pathname === route || pathname.startsWith(
 * "${route}/")`) - a detail page (`/app/planners/some-slug`) still
 * belongs to the section its listing route owns, not a route the table
 * doesn't otherwise know about. `/app` is matched exactly first: as a
 * bare prefix it would otherwise shadow every other entry, since every
 * real Dashboard route starts with `/app/`.
 *
 * Falls back to the home title for anything unmatched (an unknown path
 * under `/app`, reached only via `AppNotFound`) - the Dashboard shell
 * still renders a Header on that route, and "My Planners" is a more
 * honest default than leaving the title blank.
 */
export function getDashboardPageTitle(pathname: string): string {
  if (pathname === "/app") {
    return HOME_TITLE;
  }

  for (const [route, title] of Object.entries(dashboardPageTitles)) {
    if (route === "/app") continue;
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return title;
    }
  }

  return HOME_TITLE;
}

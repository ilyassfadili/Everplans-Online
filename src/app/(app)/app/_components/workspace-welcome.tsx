import { Heading, Text } from "@/components/ui";

interface WorkspaceWelcomeProps {
  /** Real session data only - `undefined` renders the generic fallback greeting rather than a fake name. */
  firstName?: string;
}

/**
 * The page's welcome region - real identity, no placeholder data, and no
 * raw email as the primary greeting (Dashboard V2 Prompt 1 Phase 1 §4 is
 * explicit: prefer "Welcome back, [First Name]" over showing an email).
 * The email still appears, just one level down and in the right place -
 * `UserProfileMenu` (the sidebar/mobile-drawer footer), where a secondary
 * identity line is appropriate rather than a primary one. This component
 * no longer carries an eyebrow of its own for that reason: naming the
 * workspace's owner is now the sidebar's job, done once, not repeated
 * here.
 *
 * `as="h2"`, not `"h1"`: the Dashboard's real `<h1>` is now
 * `DashboardHeaderTitle`, sticky above every route including this one
 * (Header Prompt §3 - Header shows "My Planners," this greeting stays
 * "Welcome back, Ilyass" - different content, deliberately not deduped,
 * but there's still only one page title/`<h1>`, and it lives in the
 * Header, not here).
 */
export function WorkspaceWelcome({ firstName }: WorkspaceWelcomeProps) {
  return (
    <div className="animate-hero-in" style={{ animationDelay: "40ms" }}>
      <Heading as="h2" size="h2">
        {firstName ? `Welcome back, ${firstName}.` : "Welcome to your workspace."}
      </Heading>
      <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
        This is your Everplans workspace - the home for the planners you&rsquo;ll add as they
        become available.
      </Text>
    </div>
  );
}

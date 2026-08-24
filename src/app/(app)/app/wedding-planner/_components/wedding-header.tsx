import { Eyebrow, Heading, Text } from "@/components/ui";
import type { Wedding } from "@/types/wedding";

interface WeddingHeaderProps {
  wedding: Wedding;
}

function formatWeddingDate(weddingDate: string | null): string {
  if (!weddingDate) {
    return "Date not set yet";
  }

  // `weddingDate` is a plain `YYYY-MM-DD` (Postgres `date`, no time
  // component) - parsed as UTC and formatted with `timeZone: "UTC"` so it
  // renders as the calendar day the couple actually picked, never shifted
  // a day earlier by the visitor's own local offset.
  const date = new Date(`${weddingDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * The workspace's own personalized identity block - the Wedding Planner's
 * equivalent of `/app`'s `WorkspaceWelcome`, real session data only (this
 * user's own workspace, resolved server-side), never a generic placeholder
 * greeting. The "N days to go" countdown used to live here as a small
 * badge - it moved to its own dedicated, live-ticking `WeddingCountdown`
 * card right below the header, so it isn't duplicated in two places on the
 * same page. The small "Your Wedding" eyebrow above the couple's names is
 * the one deliberate emotional touch here - answers "what are we planning"
 * in the first half-second, per the brief's visual-hierarchy goal, without
 * adding a second sentence of copy.
 */
export function WeddingHeader({ wedding }: WeddingHeaderProps) {
  return (
    <div className="animate-hero-in" style={{ animationDelay: "40ms" }}>
      <Eyebrow tone="brand">Your Wedding</Eyebrow>
      <Heading as="h1" size="h2" className="mt-1">
        {wedding.partnerOneName} &amp; {wedding.partnerTwoName}
      </Heading>
      <Text size="body-lg" tone="muted" className="mt-2">
        {formatWeddingDate(wedding.weddingDate)}
      </Text>
    </div>
  );
}

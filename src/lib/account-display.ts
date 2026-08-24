/**
 * Pure display helpers for "who's signed in," shared by every Header/shell
 * surface that renders identity - `UserProfileMenu` (sidebar/mobile-drawer
 * footer) and `AccountMenu` (the Header's own account control). Not
 * `server-only`: `AccountMenu` is a Client Component (it owns open/close
 * state), so this logic has to live somewhere both a Server Component
 * (`UserProfileMenu`) and a Client Component can import - unlike
 * `@/lib/profile.ts`, which is real data access and correctly stays
 * `server-only`.
 */

/**
 * Derives 1-2 initials for the avatar badge: first letters of the first
 * two words of a real display name, or the first two characters of a
 * single-word name, or - only once neither exists - the first character
 * of the email. Never invented, never "??" as a design flourish; the `?`
 * fallback is reached only if a signed-in user somehow has neither a
 * profile row nor an email at all, which the auth architecture doesn't
 * currently allow but this function still degrades safely for.
 */
export function getAccountInitials(displayName: string | null, email?: string): string {
  if (displayName) {
    const words = displayName.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
    }
    return words[0]!.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email[0]!.toUpperCase();
  }
  return "?";
}

/** The first word of a real display name - the Header's "avatar + first name" treatment (Header Prompt §11), never derived from an email. */
export function getAccountFirstName(displayName: string | null): string | null {
  if (!displayName) return null;
  return displayName.trim().split(/\s+/)[0] ?? null;
}

/**
 * The identity label every account surface shows as *primary* text - never
 * the raw email address (Header Prompt §11: "Do not show the user's raw
 * email as the primary Header identity"). Prefers the real display name;
 * when there isn't one yet, derives a readable name from the email's local
 * part rather than printing the address itself - `"jane.doe23@x.com"`
 * becomes `"Jane Doe"`, not `"jane.doe23@x.com"`. The email itself still
 * appears, just as the secondary line beside this one (`AccountMenu`/
 * `UserProfileMenu`), never promoted to primary.
 */
export function getAccountDisplayLabel(displayName: string | null, email?: string): string {
  if (displayName) return displayName;

  const localPart = email?.split("@")[0];
  const words = localPart
    ?.split(/[._-]+/)
    .map((word) => word.replace(/\d+$/, ""))
    .filter(Boolean);

  if (words && words.length > 0) {
    return words.map((word) => `${word[0]!.toUpperCase()}${word.slice(1)}`).join(" ");
  }

  return "Your account";
}

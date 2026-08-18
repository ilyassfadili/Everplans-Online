/**
 * Maps a Supabase Auth error to safe, user-facing copy. An allowlist, not a
 * pass-through: known messages get friendlier phrasing, anything
 * unrecognized gets a generic fallback rather than whatever internal text
 * Supabase happened to return. Deliberately does NOT distinguish "wrong
 * password" from "no such account" - Supabase's own "Invalid login
 * credentials" already avoids that distinction on purpose, and re-splitting
 * it here would reintroduce account-enumeration.
 */
export function getAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "That email and password combination doesn't match an account. Double-check and try again.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirm your email before signing in - check your inbox for the confirmation link.";
  }
  if (normalized.includes("user already registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (normalized.includes("password should be at least")) {
    return "Choose a longer password and try again.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts - please wait a moment and try again.";
  }

  return "Something went wrong. Please try again in a moment.";
}

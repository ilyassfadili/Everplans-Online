/**
 * The application-owned profile row - `public.profiles` (see
 * `supabase/migrations/20260819000001_profiles.sql` and
 * `20260821000000_profile_details.sql`). `id` is always equal to the
 * owning `auth.users.id`; there is no separate profile identifier, since
 * a profile can never exist without, or independently of, its auth user
 * (see the migration's `on delete cascade` and insert-only-via-trigger
 * design).
 *
 * Deliberately not merged with `@supabase/supabase-js`'s `User` type: that
 * type describes the Auth identity (email, metadata, provider info,
 * etc.), this describes the one thing this application currently owns
 * about a user beyond that. Keeping them separate types is what makes the
 * "auth vs. application data" boundary explicit in code, not just in the
 * database schema.
 */
export interface Profile {
  id: string;
  /** Auto-derived from `firstName`/`lastName` by a database trigger whenever either changes (see the migration) - never written directly outside that trigger. */
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  /** Public URL into the `avatars` Storage bucket, or `null` before one's ever been uploaded - never a stock/placeholder image. */
  avatarUrl: string | null;
  language: ProfileLanguage;
  dateFormat: ProfileDateFormat;
  timeFormat: ProfileTimeFormat;
  createdAt: string;
  updatedAt: string;
}

/** The only language this app actually renders in today - matches `profiles_language_allowed` (the migration) exactly; extend both together. */
export type ProfileLanguage = "en";

export type ProfileDateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

export type ProfileTimeFormat = "12h" | "24h";

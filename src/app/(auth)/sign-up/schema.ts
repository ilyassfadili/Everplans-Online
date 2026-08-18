import { z } from "zod";

/*
  minLength(8) here is a reasonable client-side floor for immediate
  feedback, not an assertion of Supabase's actual configured policy - this
  project's Auth settings aren't something the app can introspect. The
  server action is the real check: whatever Supabase's API actually
  enforces wins, and its own message is what gets shown if this floor
  wasn't strict enough.

  No confirmPassword field - the sign-up card was simplified down to one
  password field, with the existing show/hide toggle standing in for the
  typo-catching a second field would have provided.

  fullName goes into Supabase's user_metadata, not a new table - there's no
  profile page to read it yet, but it's stored under the same `full_name`
  key Google OAuth sign-ups already populate automatically, so both paths
  agree on where a display name lives once something reads it.
*/
export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

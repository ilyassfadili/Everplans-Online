import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  // Deliberately not re-validating strength here - this is signing in with
  // an existing password, so the only client-side check that makes sense
  // is "did you type something at all."
  password: z.string().min(1, "Enter your password."),
});

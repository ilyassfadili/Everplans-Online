import { z } from "zod";

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});

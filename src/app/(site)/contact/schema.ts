import { z } from "zod";

export const CONTACT_REASONS = [
  { value: "general", label: "General question" },
  { value: "product", label: "Product question" },
  { value: "feedback", label: "Feedback" },
  { value: "technical", label: "Technical issue" },
  { value: "partnership", label: "Partnership or business inquiry" },
] as const;

/**
 * The single source of truth for contact-form validation, used by both the
 * client (immediate field feedback) and the server action (the check that
 * actually matters - the client-side pass is a courtesy, not the boundary).
 *
 * `company` is a honeypot: a field real visitors never see or fill. Real
 * submissions arrive with it empty; a filled value is a strong signal of
 * an automated submission, handled without a CAPTCHA or third-party
 * dependency.
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200, "That name looks too long."),
  email: z.email("Enter a valid email address.").max(320),
  reason: z.enum(
    CONTACT_REASONS.map((r) => r.value) as [string, ...string[]],
    "Choose a reason.",
  ),
  message: z
    .string()
    .trim()
    .min(10, "Say a little more - at least 10 characters.")
    .max(5000, "That message is longer than we can take right now - try trimming it down."),
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** One of `CONTACT_REASONS`' `value`s - used to pre-select a reason from outside the form (see `ContactOptions`). */
export type ContactReason = (typeof CONTACT_REASONS)[number]["value"];

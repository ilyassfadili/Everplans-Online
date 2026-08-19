"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { contactFormSchema } from "./schema";

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "reason" | "message", string>>;
}

// No email address, social account, or other channel exists yet for this
// product (confirmed against src/config/site.ts and the Contact FAQ, which
// says outright: "This form is the way to reach Everplans right now.") - so
// this can't promise an alternative that doesn't exist. Retrying is the only
// truthful next step available.
const GENERIC_ERROR =
  "Something went wrong sending your message. Please try again in a moment - this form is currently the only way to reach us.";

/**
 * Server Action backing the contact form. Runs exclusively on the server -
 * the Supabase insert here uses the server client and is never reachable
 * from client code, so this is the actual security boundary, not the
 * client-side validation (which only exists for immediate field feedback).
 *
 * There is no fallback "pretend it worked" path: if the insert fails for
 * any reason - including the `contact_submissions` table not existing yet
 * because the migration hasn't been applied - this returns a real error
 * state. Success is only ever reported after Supabase confirms the row.
 */
export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    reason: formData.get("reason"),
    message: formData.get("message"),
    company: formData.get("company"),
  };

  const parsed = contactFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: ContactFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email" || field === "reason" || field === "message") {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { status: "error", message: "Check the highlighted fields and try again.", fieldErrors };
  }

  const { name, email, reason, message, company } = parsed.data;

  // Honeypot tripped - a real visitor never sees or fills this field.
  // Report success without writing anything, so automated senders get no
  // signal that they were detected.
  if (company) {
    return { status: "success" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("contact_submissions").insert({ name, email, reason, message });

    if (error) {
      console.error("[contact] submission insert failed:", error.code, error.message);
      return { status: "error", message: GENERIC_ERROR };
    }

    return { status: "success" };
  } catch (error) {
    console.error("[contact] unexpected submission error:", error);
    return { status: "error", message: GENERIC_ERROR };
  }
}

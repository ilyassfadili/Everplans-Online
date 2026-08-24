"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Ends the current session and returns to the public site. The one
 * sign-out path for the whole app - shared by the `(app)` shell now, and
 * by any future in-app "Log out" control - rather than each place that
 * needs it calling `supabase.auth.signOut()` directly.
 *
 * Lives beside the DAL rather than under `(auth)/actions.ts`: that file is
 * specifically the public sign-in/sign-up flows' shared action, and
 * sign-out is the authenticated app's concern, not the public auth
 * pages'.
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where Supabase sends the browser back after an OAuth provider (Google,
 * GitHub) redirect. A plain Route Handler, not a page - it never renders
 * anything, it exchanges the `code` query param for a session (through the
 * server client, so cookies are set the same correct way every other signed-
 * in request on this site sets them) and redirects on.
 *
 * Lives outside both `(site)` and `(auth)` on purpose: it's a technical
 * endpoint, not a page with a layout or a place in either route group.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // No dashboard or customer workspace exists yet - Home is the only
      // honest destination, same as the email/password Server Actions.
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}

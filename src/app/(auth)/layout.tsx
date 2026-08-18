import type { ReactNode } from "react";

import { SkipLink } from "@/components/site/skip-link";

/**
 * Shell for the account entry routes. Deliberately framed differently from
 * the content pages: no primary nav, no auth CTAs (redundant on the pages
 * that *are* those CTAs) - just `SkipLink` for accessibility and a `#main`
 * landmark for it to jump to.
 *
 * No header, no centering wrapper here on purpose: each page renders
 * `AuthSplitLayout` (`src/components/auth/split-layout.tsx`), which owns
 * the full-height split screen, the logo placement, and all the
 * responsive centering itself. This layout only needs to get out of the way.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <main id="main">{children}</main>
    </>
  );
}

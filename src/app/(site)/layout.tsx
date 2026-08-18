import type { ReactNode } from "react";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { SkipLink } from "@/components/site/skip-link";

/**
 * Shell for the public website's content routes: skip link, global header,
 * page content, global footer. Every `(site)` route gets this automatically
 * just by having a `page.tsx` in this route group - no page re-implements
 * navigation or footer itself.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

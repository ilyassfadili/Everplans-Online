import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/*
  Everything is allowed to crawl, including /sign-in and /sign-up - those
  pages carry their own <meta name="robots" content="noindex"> instead of
  a robots.txt Disallow. A Disallow would stop crawlers from ever fetching
  the page, which means they'd never see the noindex directive either; per
  Google's own guidance, noindex only works reliably on pages that remain
  crawlable.
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

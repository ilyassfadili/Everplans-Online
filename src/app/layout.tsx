import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import "@/styles/globals.css";

/*
  One family, sitewide (2026-08-19) - Outfit replaced the earlier
  Fraunces/Inter pairing everywhere, headline moments and body copy alike.
  A single geometric sans reads as more uniformly "2026 product" than a
  serif/sans split; weight and size carry the hierarchy the two faces used
  to. Self-hosted via next/font, exposed as one CSS variable that the
  design system's --font-sans AND --font-display tokens both read from
  (see globals.css) rather than being reached for directly.
*/
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  /* Makes every relative URL in page metadata resolve against the site. */
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon/favicon.png",
    apple: "/favicon/apple-touch-icon.png",
  },
  openGraph: {
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.locale}
      // Opts back into Next 16's route-transition scroll override: without
      // this, our global `scroll-behavior: smooth` (globals.css, for
      // in-page anchors like the skip link) would also apply to page
      // navigations, making every route change scroll smoothly instead of
      // snapping instantly. See Next's version-16 upgrade notes.
      data-scroll-behavior="smooth"
      className={outfit.variable}
    >
      <body>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}

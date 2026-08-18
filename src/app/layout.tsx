import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import "@/styles/globals.css";

/*
  Two families, deliberately paired rather than one face stretched across
  every role. Fraunces (a soft-serif with real optical-size character at
  display sizes) carries headline moments; Inter - already proven for body
  copy and UI density - handles everything from H3 down. Both are variable
  fonts, both self-hosted by next/font, both exposed as CSS variables that
  the design system's --font-sans / --font-display tokens read from
  (see globals.css) rather than being reached for directly.
*/
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  /* Makes every relative URL in page metadata resolve against the site. */
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
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
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}

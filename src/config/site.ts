/**
 * Canonical, non-secret facts about the Everplans public website.
 *
 * Anything here is safe to ship to the browser. Credentials and
 * environment-specific values belong in the environment layer, never here.
 */
export const siteConfig = {
  name: "Everplans",
  domain: "everplans.online",
  url: "https://everplans.online",
  locale: "en",
  description:
    "Everplans is a digital planning platform for people who want their plans to be clear, organised and genuinely usable.",
} as const;

export type SiteConfig = typeof siteConfig;

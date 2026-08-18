import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/typography";
import { authNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

import { Logo } from "./logo";

interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

const linkGroups: FooterLinkGroup[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Planners", href: "/planners" },
      { label: "Categories", href: "/categories" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: authNav.signIn.label, href: authNav.signIn.href },
      { label: authNav.signUp.label, href: authNav.signUp.href },
    ],
  },
];

/*
  A deliberate exception to the rest of the site: a fixed dark surface
  (`bg-deep`, #000814) rather than the usual canvas/surface. It reuses the
  existing "deep surface" tokens (added for exactly this - a full-bleed
  dark closing moment) instead of inventing new ones, and it never varies
  with anything - there's no dark-mode swap left in this palette to react
  to in the first place.

  #415A77 (`brand`) only reaches ~2.8:1 against #000814 - short of even
  the 3:1 UI-component minimum, let alone 4.5:1 for text - so it never
  appears here as text or a border. It's confined to fill roles that carry
  no contrast requirement: the logo mark's square and the ambient glow
  behind the wordmark. Every piece of actual text/dividers uses the
  `ink-on-deep`/`ink-on-deep-muted` tokens (fixed white-on-navy values,
  not ad-hoc opacity) instead. The focus ring is pinned to white for the
  same reason: the sitewide ring color is the same underlying #415A77 and
  would be nearly invisible on this surface.
*/
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-deep text-ink-on-deep [--focus-ring:#ffffff]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl"
      />

      <Container>
        <div className="grid grid-cols-1 gap-y-12 py-16 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-x-12 lg:py-20">
          <div className="flex flex-col gap-5 sm:col-span-3 lg:col-span-1">
            <Logo tone="on-dark" />
            <div className="flex max-w-xs flex-col gap-3">
              <Text as="p" className="font-display text-h4 font-medium tracking-tight text-balance text-ink-on-deep">
                Everplans exists so a plan doesn&rsquo;t stay just an idea.
              </Text>
              <Text as="p" size="body-sm" className="text-ink-on-deep-muted">
                We&rsquo;re building a home for interactive planners - structured, revisitable,
                and built around what you&rsquo;re actually trying to get done.
              </Text>
            </div>
          </div>

          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-label font-semibold uppercase tracking-[0.08em] text-ink-on-deep-muted">
                {group.title}
              </p>
              <ul className="mt-5 flex flex-col gap-3.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      variant="subtle"
                      className="text-body-sm text-ink-on-deep-muted hover:text-ink-on-deep"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-ink-on-deep/10 py-8 text-body-sm text-ink-on-deep-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>{siteConfig.domain}</p>
        </div>
      </Container>
    </footer>
  );
}

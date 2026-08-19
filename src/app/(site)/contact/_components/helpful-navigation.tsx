import { ArrowUpRight } from "lucide-react";

import { Card, Container, Heading, Icon, Link, Reveal, Section, Text } from "@/components/ui";

const links = [
  { label: "About Everplans", href: "/about", description: "The thinking behind the platform." },
  { label: "Planners", href: "/planners", description: "What Everplans is building toward." },
  { label: "Categories", href: "/categories", description: "How planners will be organized." },
  { label: "Blog", href: "/blog", description: "Writing on planning and organization." },
];

export function HelpfulNavigation() {
  return (
    <Section background="surface-muted" spacing="sm">
      <Container size="narrow">
        <Reveal>
          <Heading as="h2" size="h4" className="text-center">
            Not sure you need to reach out?
          </Heading>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {links.map((link, i) => (
            <Reveal key={link.href} delay={100 + i * 70}>
              <Link href={link.href} className="block no-underline">
                <Card variant="interactive" padding="md" className="flex h-full items-start justify-between gap-3">
                  <span className="flex flex-col gap-1">
                    <Text as="span" weight="semibold">
                      {link.label}
                    </Text>
                    <Text as="span" size="body-sm" tone="muted">
                      {link.description}
                    </Text>
                  </span>
                  <Icon icon={ArrowUpRight} size="sm" className="mt-0.5 shrink-0 text-ink-faint" />
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

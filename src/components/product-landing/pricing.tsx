import { Check } from "lucide-react";

import { Button, Card, Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * Purchase/access information - reads `config.pricing` (`ProductPricing`)
 * rather than hardcoding a number, so a future product with a real price
 * plugs in without a rewrite. `model: "pending"` (Wedding Planner's current
 * state) renders `priceLabel` as plain text rather than a giant display
 * number - a real price gets the big, confident treatment; "not announced
 * yet" shouldn't borrow that same visual weight, since it isn't a number at
 * all. Never invents a price to fill that slot (see `wedding-planner.ts`'s
 * own comment on why one doesn't exist yet).
 */
export function ProductPricing({ config }: { config: ProductLandingConfig }) {
  const { pricing } = config;
  const hasRealPrice = pricing.model !== "pending";

  return (
    <Section background="surface-muted">
      <Container size="narrow">
        <Reveal className="text-center">
          <Eyebrow>Pricing</Eyebrow>
          <Heading as="h2" className="mt-3">
            What you get with {config.name}
          </Heading>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <Card padding="lg" variant="elevated" className="mx-auto max-w-lg text-center">
            {hasRealPrice ? (
              <p className="font-display text-h1 text-ink">{pricing.priceLabel}</p>
            ) : (
              <Text size="body-lg" weight="semibold" className="text-ink">
                {pricing.priceLabel}
              </Text>
            )}
            <Text tone="muted" className="mx-auto mt-3 max-w-sm">
              {pricing.billingNote}
            </Text>

            <ul className="mt-8 flex flex-col gap-3 text-left">
              {pricing.included.map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.25} aria-hidden="true" />
                  <Text size="body-sm" tone="muted">
                    {line}
                  </Text>
                </li>
              ))}
            </ul>

            <Button href={config.ctaHref} size="lg" className="mt-8 w-full">
              {pricing.ctaLabel}
            </Button>
          </Card>
        </Reveal>
      </Container>
    </Section>
  );
}

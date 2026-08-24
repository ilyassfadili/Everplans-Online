import { Check } from "lucide-react";

import { Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * "What's included" - a single scannable list so a visitor can see the
 * whole product without reading the rest of the page. `id="included"` is
 * the hero's secondary CTA anchor target.
 */
export function ProductIncluded({ config }: { config: ProductLandingConfig }) {
  return (
    <Section id="included" background="canvas">
      <Container size="narrow">
        <Reveal className="text-center">
          <Eyebrow>What&rsquo;s included</Eyebrow>
          <Heading as="h2" className="mt-3">
            Everything in {config.name}
          </Heading>
        </Reveal>

        <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {config.included.map((item, index) => (
            <Reveal key={item.title} delay={index * 50} as="li" className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
                <Check className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <div>
                <Text weight="semibold">{item.title}</Text>
                <Text size="body-sm" tone="muted" className="mt-0.5">
                  {item.body}
                </Text>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

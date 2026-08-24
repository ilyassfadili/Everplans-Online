import { Button, Container, Heading, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/** Closing conversion moment - same brand band + centered layout Home's FinalCta uses. */
export function ProductFinalCta({ config }: { config: ProductLandingConfig }) {
  return (
    <Section background="deep">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2" className="text-balance text-ink-on-deep">
            {config.finalCta.heading}
          </Heading>
          <Text size="body-lg" className="mx-auto mt-4 max-w-lg text-ink-on-deep-muted">
            {config.finalCta.body}
          </Text>
          <div className="mt-8">
            <Button href={config.ctaHref} variant="secondary" size="lg">
              {config.hero.primaryCtaLabel}
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

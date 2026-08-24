import { Container, Heading, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/** Who the product is for - one focused statement, no demographic targeting. */
export function ProductWhoItsFor({ config }: { config: ProductLandingConfig }) {
  return (
    <Section background="brand">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2" className="text-balance text-ink-on-brand">
            {config.whoItsFor.heading}
          </Heading>
          <Text size="body-lg" className="mx-auto mt-4 max-w-xl text-ink-on-brand/80">
            {config.whoItsFor.body}
          </Text>
        </Reveal>
      </Container>
    </Section>
  );
}

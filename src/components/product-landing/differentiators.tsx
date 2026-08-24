import { Card, Container, Heading, Icon, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/** Why this product is different - product qualities only, never an unverifiable superlative claim. */
export function ProductDifferentiators({ config }: { config: ProductLandingConfig }) {
  return (
    <Section background="surface">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Heading as="h2" className="text-balance">
            What makes {config.name} different
          </Heading>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {config.differentiators.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <Card padding="lg" className="h-full">
                <div className="flex size-11 items-center justify-center rounded-full bg-accent-subtle text-brand">
                  <Icon icon={item.icon} />
                </div>
                <Text size="body-lg" weight="semibold" className="mt-5">
                  {item.title}
                </Text>
                <Text size="body-sm" tone="muted" className="mt-2">
                  {item.body}
                </Text>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

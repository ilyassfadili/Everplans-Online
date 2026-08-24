import { Container, Icon, Reveal, Section } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/** Outcome-focused value props, right after the hero - what the product does *for you*, not a feature list. */
export function ProductValueProps({ config }: { config: ProductLandingConfig }) {
  return (
    <Section background="canvas">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {config.valueProps.map((prop, index) => (
            <Reveal key={prop.title} delay={index * 70} className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
              <div className="flex size-11 items-center justify-center rounded-full bg-accent-subtle text-brand">
                <Icon icon={prop.icon} />
              </div>
              <p className="text-body-lg font-semibold text-ink">{prop.title}</p>
              <p className="text-body-sm text-ink-muted">{prop.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

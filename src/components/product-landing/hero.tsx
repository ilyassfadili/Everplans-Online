import { Button, Container, Eyebrow, Heading, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

import { ProductImageSlot } from "./image-slot";

/**
 * The Product Landing Page hero - same dark `bg-deep` band and
 * `animate-hero-in` entrance Home's and Planners' heroes use, so a visitor
 * arriving from either public page or the Store recognizes it as the same
 * site. The one deliberate difference: the visual half is a real
 * `ProductImageSlot`, not an abstract illustration - this is where the
 * actual product should be seen, per the brief ("the product itself should
 * remain the hero").
 */
export function ProductHero({ config }: { config: ProductLandingConfig }) {
  return (
    <Section spacing="lg" background="deep">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <Eyebrow tone="accent" className="animate-hero-in" style={{ animationDelay: "40ms" }}>
              {config.hero.eyebrow}
            </Eyebrow>
            <Heading
              as="h1"
              size="display"
              className="animate-hero-in text-balance text-ink-on-deep"
              style={{ animationDelay: "110ms" }}
            >
              {config.hero.headline}
            </Heading>
            <Text
              size="body-lg"
              className="max-w-xl animate-hero-in text-ink-on-deep-muted"
              style={{ animationDelay: "190ms" }}
            >
              {config.hero.subhead}
            </Text>
            <div
              className="animate-hero-in flex flex-wrap items-center justify-center gap-3 pt-2 lg:justify-start"
              style={{ animationDelay: "270ms" }}
            >
              <Button href={config.ctaHref} variant="secondary" size="lg">
                {config.hero.primaryCtaLabel}
              </Button>
              <Button href={config.hero.secondaryCtaHref} variant="outline-on-dark" size="lg">
                {config.hero.secondaryCtaLabel}
              </Button>
            </div>
          </div>

          <div className="animate-hero-in" style={{ animationDelay: "220ms" }}>
            <ProductImageSlot
              placeholder={config.hero.image}
              src={config.hero.image.src}
              priority
              className="shadow-2xl"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

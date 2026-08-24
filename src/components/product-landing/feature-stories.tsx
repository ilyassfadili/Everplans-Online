import { Check } from "lucide-react";

import { Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProductFeatureStory, ProductLandingConfig } from "@/types/product-landing";

import { ProductImageSlot } from "./image-slot";

// Full literal strings, not interpolated pieces - the Tailwind scanner needs
// each complete class name written out somewhere in source (see AGENTS.md's
// "Tailwind gotcha").
const imageOrderClass: Record<ProductFeatureStory["imagePosition"], string> = {
  left: "lg:order-1",
  right: "lg:order-2",
};
const textOrderClass: Record<ProductFeatureStory["imagePosition"], string> = {
  left: "lg:order-2",
  right: "lg:order-1",
};

/**
 * The product storytelling sequence - grouped feature stories, alternating
 * image/text sides for visual rhythm, each pairing a screenshot slot with
 * what it proves ("screenshot -> heading -> benefit -> explanation", per the
 * brief) rather than a flat feature grid or an unexplained screenshot
 * gallery.
 */
export function ProductFeatureStories({ config }: { config: ProductLandingConfig }) {
  return (
    <Section background="surface">
      <div className="flex flex-col gap-16 md:gap-24">
        {config.featureStories.map((story, index) => (
          <Container key={story.title}>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal delay={index % 2 === 0 ? 0 : 60} className={cn(imageOrderClass[story.imagePosition])}>
                <ProductImageSlot placeholder={story.image} src={story.image.src} />
              </Reveal>

              <Reveal delay={index % 2 === 0 ? 60 : 0} className={cn(textOrderClass[story.imagePosition])}>
                <Eyebrow>{story.eyebrow}</Eyebrow>
                <Heading as="h3" size="h2" className="mt-3">
                  {story.title}
                </Heading>
                <Text size="body-lg" tone="muted" className="mt-4">
                  {story.body}
                </Text>
                <ul className="mt-6 flex flex-col gap-3">
                  {story.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
                      <Text size="body-sm" tone="muted">
                        {bullet}
                      </Text>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </Container>
        ))}
      </div>
    </Section>
  );
}

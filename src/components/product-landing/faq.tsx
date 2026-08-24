import { Accordion, AccordionItem, Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/** Realistic buyer questions - `Accordion`'s native `<details>` behavior needs no client JS. */
export function ProductFaq({ config }: { config: ProductLandingConfig }) {
  return (
    <Section background="canvas">
      <Container size="narrow">
        <Reveal className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <Heading as="h2" className="mt-3">
            Questions about {config.name}
          </Heading>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <Accordion>
            {config.faq.map((item) => (
              <AccordionItem key={item.question} name={`${config.slug}-faq`} question={item.question}>
                <Text tone="muted">{item.answer}</Text>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </Section>
  );
}

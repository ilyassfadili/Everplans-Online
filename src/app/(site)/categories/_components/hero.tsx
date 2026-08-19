import { Container, Eyebrow, Heading, Section, Text } from "@/components/ui";

/*
  Dark hero band (bg-deep, #000814), matching Home and Planners so every
  major page opens on the same signature surface. Text colors are the
  "on-deep"/accent tokens rather than default `ink`/`brand` for the usual
  contrast reason: #415A77 measures only 2.8:1 against #000814.
*/
export function CategoriesHero() {
  return (
    <Section spacing="lg" background="deep">
      <Container size="narrow" className="text-center">
        <Eyebrow tone="accent" className="animate-hero-in" style={{ animationDelay: "40ms" }}>
          Categories
        </Eyebrow>
        <Heading
          as="h1"
          size="display"
          className="animate-hero-in mt-3 text-ink-on-deep"
          style={{ animationDelay: "110ms" }}
        >
          How Everplans organizes what you plan
        </Heading>
        <Text
          size="body-lg"
          className="mx-auto mt-4 max-w-xl animate-hero-in text-ink-on-deep-muted"
          style={{ animationDelay: "190ms" }}
        >
          Categories group planners by the part of life or project they’re built for - big
          milestones, everyday projects, and everything in between - so you can find the one
          that actually fits.
        </Text>
      </Container>
    </Section>
  );
}

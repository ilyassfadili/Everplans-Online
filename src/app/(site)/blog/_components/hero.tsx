import { Container, Eyebrow, Heading, Section, Text } from "@/components/ui";

/*
  Dark hero band (bg-deep, #000814), matching Home and Planners so every
  major page opens on the same signature surface. Text colors are the
  "on-deep"/accent tokens rather than default `ink`/`brand` for the usual
  contrast reason: #415A77 measures only 2.8:1 against #000814.
*/
export function BlogHero() {
  return (
    <Section spacing="lg" background="deep">
      <Container size="narrow" className="text-center">
        <Eyebrow className="text-accent">Blog</Eyebrow>
        <Heading as="h1" size="display" className="mt-3 text-ink-on-deep">
          Notes on planning things properly
        </Heading>
        <Text size="body-lg" className="mx-auto mt-4 max-w-xl text-ink-on-deep-muted">
          Practical writing on planning, organization, and working through the projects and
          decisions that don’t fit on a sticky note.
        </Text>
      </Container>
    </Section>
  );
}

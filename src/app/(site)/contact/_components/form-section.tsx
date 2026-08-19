import { Container, Reveal, Section } from "@/components/ui";

import type { ContactReason } from "../schema";
import { ContactForm } from "./contact-form";

interface ContactFormSectionProps {
  /** Reason to pre-select, carried in from `ContactOptions` via the `?reason=` query param. */
  initialReason?: ContactReason;
}

export function ContactFormSection({ initialReason }: ContactFormSectionProps) {
  return (
    <Section background="canvas">
      <Container size="narrow">
        <Reveal>
          <ContactForm initialReason={initialReason} />
        </Reveal>
      </Container>
    </Section>
  );
}

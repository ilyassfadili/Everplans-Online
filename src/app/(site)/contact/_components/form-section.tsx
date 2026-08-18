import { Container, Section } from "@/components/ui";

import { ContactForm } from "./contact-form";

export function ContactFormSection() {
  return (
    <Section background="canvas">
      <Container size="narrow">
        <ContactForm />
      </Container>
    </Section>
  );
}

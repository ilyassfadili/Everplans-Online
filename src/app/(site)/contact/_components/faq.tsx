import { Accordion, AccordionItem, Container, Heading, Section } from "@/components/ui";

const faqs = [
  {
    question: "How long does it take to hear back?",
    answer:
      "We read every message. Everplans is a small, early-stage platform, so there's no guaranteed response-time policy yet - but we do reply.",
  },
  {
    question: "Is there phone or live-chat support?",
    answer: "Not currently. This form is the way to reach Everplans right now.",
  },
  {
    question: "I found a bug - what should I include?",
    answer:
      "Choose \"Technical issue\" as the reason, and describe what you were doing and what you expected to happen. The more specific, the faster we can look into it.",
  },
];

export function ContactFaq() {
  return (
    <Section background="canvas">
      <Container size="narrow">
        <Heading as="h2" size="h3" className="text-center">
          A few things worth knowing
        </Heading>
        <div className="mt-8">
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} name="contact-faq" question={faq.question}>
                {faq.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </Section>
  );
}

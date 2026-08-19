import { Briefcase, HelpCircle, MessageSquare, Package, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, Container, Icon, Link, Reveal, Section, Text } from "@/components/ui";

import type { ContactReason } from "../schema";

const options: { icon: LucideIcon; label: string; description: string; reason: ContactReason }[] = [
  { icon: HelpCircle, label: "General questions", description: "Anything about Everplans as a platform.", reason: "general" },
  { icon: Package, label: "Product questions", description: "Planners, categories, how things work.", reason: "product" },
  { icon: MessageSquare, label: "Feedback", description: "What’s working, what isn’t, what’s missing.", reason: "feedback" },
  { icon: Wrench, label: "Technical issues", description: "Something broken or behaving unexpectedly.", reason: "technical" },
  { icon: Briefcase, label: "Partnerships", description: "Business inquiries and collaboration.", reason: "partnership" },
];

/**
 * Each option is a real control, not decoration: it jumps to the contact
 * form below and pre-selects the matching reason there (see `ContactForm`'s
 * `initialReason` prop) - so picking "Technical issues" here means the form
 * you land on already has that reason chosen. `Card variant="interactive"`
 * is the same "whole card is a link" affordance used elsewhere on this page
 * (see `HelpfulNavigation`), so this reads as clickable rather than as
 * plain informational copy.
 */
export function ContactOptions() {
  return (
    <Section background="surface" spacing="sm">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {options.map((option, i) => (
            <Reveal key={option.label} delay={i * 70}>
              <Link href={`/contact?reason=${option.reason}#contact-form`} className="block no-underline">
                <Card
                  variant="interactive"
                  padding="md"
                  className="flex h-full flex-col items-center gap-2 text-center"
                >
                  <Icon icon={option.icon} className="text-brand" />
                  <Text weight="semibold" size="body-sm">
                    {option.label}
                  </Text>
                  <Text size="caption" tone="muted">
                    {option.description}
                  </Text>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

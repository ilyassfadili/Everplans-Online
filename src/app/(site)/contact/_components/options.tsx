import { Briefcase, HelpCircle, MessageSquare, Package, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container, Icon, Section, Text } from "@/components/ui";

const options: { icon: LucideIcon; label: string; description: string }[] = [
  { icon: HelpCircle, label: "General questions", description: "Anything about Everplans as a platform." },
  { icon: Package, label: "Product questions", description: "Planners, categories, how things work." },
  { icon: MessageSquare, label: "Feedback", description: "What’s working, what isn’t, what’s missing." },
  { icon: Wrench, label: "Technical issues", description: "Something broken or behaving unexpectedly." },
  { icon: Briefcase, label: "Partnerships", description: "Business inquiries and collaboration." },
];

export function ContactOptions() {
  return (
    <Section background="surface" spacing="sm">
      <Container>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {options.map((option) => (
            <div key={option.label} className="flex flex-col items-center gap-2 text-center">
              <Icon icon={option.icon} className="text-brand" />
              <Text weight="semibold" size="body-sm">
                {option.label}
              </Text>
              <Text size="caption" tone="muted">
                {option.description}
              </Text>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

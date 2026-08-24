import { Mail } from "lucide-react";
import type { Metadata } from "next";

import { Accordion, AccordionItem, Button, Card, Container, Heading, Icon, Link, Text } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";

import { PageHeader } from "../_components/page-header";

export const metadata: Metadata = {
  title: "Help",
  robots: { index: false, follow: false },
};

/**
 * `/app/help` - real content, kept in sync with what Everplans actually is
 * right now rather than the state it was in during an earlier phase. Every
 * FAQ answer below is an accurate statement about the product as it
 * genuinely exists today ("do not invent claims about products or
 * policies that don't exist") - real, purchasable planners
 * (`@/config/products`), a real one-time checkout per planner
 * (`BUDGET_PLANNER_PRODUCT`/the Wedding Planner's own `pricing`), and a
 * real order history at `/app/purchases`.
 *
 * Deliberately quiet on specifics a support FAQ shouldn't be the place to
 * announce - no literal price and no payment processor name in the copy
 * (both change independently of this page and are already shown correctly
 * on each planner's own page/Store card - this page would just be a second,
 * driftable place for the same fact), and no hard planner count (an
 * accurate number today reads as a limitation tomorrow the moment a new
 * one ships; "a growing set of planners" stays true either way).
 *
 * Reuses the existing `Accordion`/`AccordionItem`
 * (`@/components/ui/accordion.tsx`) - native `<details>`/`<summary>`,
 * already keyboard-accessible and screen-reader-friendly with no ARIA
 * authored by hand.
 *
 * "Contact Support" points at the real `/contact` page - the same
 * fully-working form the public site already has, not a fake ticketing
 * system - and the support card also lists the real inbox
 * (everplans.online@gmail.com) directly, as a genuine `mailto:` link, for
 * anyone who'd rather email than fill out a form.
 */
export default async function HelpPage() {
  await requireUser();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Help & Support" description="Answers to common questions, and how to reach us if you need more." />

      <div>
        <Heading as="h2" size="h4" className="mb-4">
          Frequently asked questions
        </Heading>
        <Accordion>
          <AccordionItem name="help-faq" question="What is Everplans?" defaultOpen>
            Everplans is a platform for interactive digital planners - structured, step-by-step tools built
            around specific kinds of plans, rather than one generic planning app. The platform comes first;
            planners are added to it over time.
          </AccordionItem>
          <AccordionItem name="help-faq" question="What planners are available?">
            Everplans offers a growing set of planners, including Wedding Planner and Budget Planner, with
            new ones added over time. Browse everything currently available in the{" "}
            <Link href="/app/store">Store</Link>, and anything you own appears in{" "}
            <Link href="/app/planners">My Planners</Link>.
          </AccordionItem>
          <AccordionItem name="help-faq" question="Do I need to pay to use Everplans?">
            Creating an Everplans account is free. Each planner is a one-time purchase - there&rsquo;s no
            subscription and no recurring charge, and once you own a planner it&rsquo;s yours for good.
            Pricing for each planner is shown on its own page before you buy.
          </AccordionItem>
          <AccordionItem name="help-faq" question="Where can I see what I've purchased?">
            <Link href="/app/purchases">Purchases</Link> lists every order you&rsquo;ve made, with its status
            and receipt details. If a planner you bought doesn&rsquo;t appear in{" "}
            <Link href="/app/planners">My Planners</Link>, check there first before contacting support.
          </AccordionItem>
          <AccordionItem name="help-faq" question="How do I reset my password?">
            From the sign-in page, select &ldquo;Forgot your password?&rdquo; and follow the emailed link.
            You&rsquo;ll be asked to choose a new password once you click through.
          </AccordionItem>
          <AccordionItem name="help-faq" question="Is my account data secure?">
            Yes - your data is protected by row-level security policies at the database layer, meaning your
            account information is only ever readable by you, enforced independently of the app itself.
          </AccordionItem>
          <AccordionItem name="help-faq" question="Can I use Everplans on my phone?">
            Yes - the whole application, including your workspace and every planner, is built to work
            comfortably on mobile, tablet, and desktop.
          </AccordionItem>
        </Accordion>
      </div>

      <Card variant="standard" padding="lg" className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
            <Icon icon={Mail} size="sm" />
          </div>
          <div>
            <Text as="p" weight="semibold">
              Still need help?
            </Text>
            <Text size="body-sm" tone="muted" className="mt-0.5">
              Send us a message, or email us directly at{" "}
              <Link href="mailto:everplans.online@gmail.com">everplans.online@gmail.com</Link>.
            </Text>
          </div>
        </div>
        <Button href="/contact" variant="outline" size="sm">
          Contact Support
        </Button>
      </Card>
    </Container>
  );
}

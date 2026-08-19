import type { Metadata } from "next";

import { ContactFaq } from "./_components/faq";
import { ContactFinalCta } from "./_components/final-cta";
import { ContactFormSection } from "./_components/form-section";
import { HelpfulNavigation } from "./_components/helpful-navigation";
import { ContactHero } from "./_components/hero";
import { ContactOptions } from "./_components/options";
import { CONTACT_REASONS } from "./schema";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Everplans - questions, feedback, technical issues, or partnership inquiries.",
};

export default async function ContactPage(props: PageProps<"/contact">) {
  const { reason } = await props.searchParams;

  // `ContactOptions` links here with `?reason=<value>` - validate against the
  // real enum rather than trusting the query string outright, so a stray or
  // tampered param just falls back to no pre-selection instead of feeding
  // something invalid into the form.
  const initialReason = CONTACT_REASONS.find((r) => r.value === reason)?.value;

  return (
    <>
      <ContactHero />
      <ContactOptions />
      <ContactFormSection initialReason={initialReason} />
      <HelpfulNavigation />
      <ContactFaq />
      <ContactFinalCta />
    </>
  );
}

import type { Metadata } from "next";

import { ContactFaq } from "./_components/faq";
import { ContactFinalCta } from "./_components/final-cta";
import { ContactFormSection } from "./_components/form-section";
import { HelpfulNavigation } from "./_components/helpful-navigation";
import { ContactHero } from "./_components/hero";
import { ContactOptions } from "./_components/options";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Everplans - questions, feedback, technical issues, or partnership inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactOptions />
      <ContactFormSection />
      <HelpfulNavigation />
      <ContactFaq />
      <ContactFinalCta />
    </>
  );
}

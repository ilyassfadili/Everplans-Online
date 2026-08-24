import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getContactsForHome } from "@/lib/home-planner/contacts";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";

import { AddContactForm } from "./_components/add-contact-form";
import { ContactList } from "./_components/contact-list";

export const metadata: Metadata = {
  title: "Important Contacts",
  robots: { index: false, follow: false },
};

/**
 * The Home Planner's important contacts (Prompt 1 Phase 2: "Create the
 * foundation for important home-related contacts"). Gated the same way
 * every Home Planner route is: no workspace yet redirects to setup.
 */
export default async function ContactsPage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const contacts = await getContactsForHome(home.id);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Important contacts
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          The people worth having on hand for {home.name} - your landlord, contractor, or
          emergency contact.
        </Text>
      </div>

      <AddContactForm homeId={home.id} />
      <ContactList contacts={contacts} />
    </Container>
  );
}

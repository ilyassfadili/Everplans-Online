import type { Metadata } from "next";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";

import { EditHomeForm } from "./_components/edit-home-form";

export const metadata: Metadata = {
  title: "Edit Home Details",
  robots: { index: false, follow: false },
};

/**
 * Edit home details (Phase 2: "test editing the profile"). Unlike Wedding
 * Planner's narrow single-field edits, Home Planner ships full home
 * profile setup as editable from day one - the same `HomeFormFields` used
 * to create the home, pre-filled with its current values. `requireHomeForCurrentUser()`
 * (Prompt 6) gates the route: a visitor without an active entitlement is
 * sent to checkout, one entitled but not yet set up is sent to home setup,
 * so this screen only ever renders for a home that genuinely exists.
 */
export default async function EditHomePage() {
  const home = await requireHomeForCurrentUser();

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Edit home details
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Update anything about your home - your changes save right here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <EditHomeForm home={home} />
      </Card>
    </Container>
  );
}

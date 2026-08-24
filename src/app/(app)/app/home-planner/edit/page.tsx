import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";

import { EditHomeForm } from "./_components/edit-home-form";

export const metadata: Metadata = {
  title: "Edit Home Details",
  robots: { index: false, follow: false },
};

/**
 * Edit home details (Phase 2: "test editing the profile"). Unlike Wedding
 * Planner's narrow single-field edits, Home Planner ships full home
 * profile setup as editable from day one - the same `HomeFormFields` used
 * to create the home, pre-filled with its current values. `getHomeForCurrentUser()`
 * gates the route: a visitor with no home yet is sent to setup instead of
 * an edit screen for something that doesn't exist.
 */
export default async function EditHomePage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

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

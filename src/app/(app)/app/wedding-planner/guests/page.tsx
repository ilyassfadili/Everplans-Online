import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui";
import { getGuestsForWedding } from "@/lib/wedding/guests";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { PageHeader } from "../../_components/page-header";
import { AddGuestForm } from "./_components/add-guest-form";
import { GuestList } from "./_components/guest-list";

export const metadata: Metadata = {
  title: "Guests",
  robots: { index: false, follow: false },
};

/**
 * The Wedding Planner's guest list and RSVP tracking (Prompt 4 Phases
 * 1-2). Gated the same way every Wedding Planner route is: no workspace
 * yet redirects to onboarding.
 */
export default async function GuestsPage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const guests = await getGuestsForWedding(wedding.id);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Guests" description="Who's invited, and where their RSVP stands." />
      <AddGuestForm weddingId={wedding.id} />
      <GuestList guests={guests} />
    </Container>
  );
}

import type { Metadata } from "next";

import { Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getHouseholdMembersForHome } from "@/lib/home-planner/household-members";
import { requireHomeForCurrentUser } from "@/lib/home-planner/homes";

import { AddMemberForm } from "./_components/add-member-form";
import { MemberList } from "./_components/member-list";

export const metadata: Metadata = {
  title: "Household",
  robots: { index: false, follow: false },
};

/**
 * The Home Planner's household management (Prompt 1 Phase 2: "Allow users
 * to establish the household members associated with the home"). Gated the
 * same way every Home Planner route is: no workspace yet redirects to
 * setup.
 */
export default async function HouseholdPage() {
  const home = await requireHomeForCurrentUser();

  const members = await getHouseholdMembersForHome(home.id);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Household
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Who&rsquo;s part of your household at {home.name}.
        </Text>
      </div>

      <AddMemberForm homeId={home.id} />
      <MemberList members={members} />
    </Container>
  );
}

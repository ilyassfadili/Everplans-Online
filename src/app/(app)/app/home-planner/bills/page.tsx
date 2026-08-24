import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getBillsForHome } from "@/lib/home-planner/bills";
import { calculateBillStatus } from "@/lib/home-planner/bill-status";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";

import { AddBillForm } from "./_components/add-bill-form";
import { BillList, type BillWithStatus } from "./_components/bill-list";
import { BillStats } from "./_components/bill-stats";

export const metadata: Metadata = {
  title: "Bills",
  robots: { index: false, follow: false },
};

/**
 * Household Bills (Everplans Home Planner Prompt 4 Phase 1) - "What
 * household expenses do I have, and what is coming up?" Gated the same
 * way every Home Planner route is: no workspace yet redirects to setup.
 */
export default async function BillsPage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const bills = await getBillsForHome(home.id);

  // Status is derived at read time, not stored (`calculateBillStatus`'s
  // own comment) - computed once here, server-side, against the real "now"
  // at render time.
  const today = new Date();
  const items: BillWithStatus[] = bills.map((bill) => ({ bill, status: calculateBillStatus(bill, today) }));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Bills
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Household expenses for {home.name}, and what&rsquo;s coming up.
        </Text>
      </div>

      <BillStats items={items} />
      <AddBillForm homeId={home.id} />
      <BillList items={items} />
    </Container>
  );
}

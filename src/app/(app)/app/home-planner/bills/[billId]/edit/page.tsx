import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card, Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getBillById } from "@/lib/home-planner/bills";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";

import { EditBillForm } from "./_components/edit-bill-form";

interface EditBillPageProps {
  params: Promise<{ billId: string }>;
}

export const metadata: Metadata = {
  title: "Edit Bill",
  robots: { index: false, follow: false },
};

/** Edit bill details - the same `BillFormFields` used to create the bill, pre-filled with its current values. */
export default async function EditBillPage({ params }: EditBillPageProps) {
  const { billId } = await params;
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const bill = await getBillById(home.id, billId);

  if (!bill) {
    notFound();
  }

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Edit bill
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Update anything about this bill - your changes save right here.
        </Text>
      </div>

      <Card variant="standard" padding="lg">
        <EditBillForm bill={bill} />
      </Card>
    </Container>
  );
}

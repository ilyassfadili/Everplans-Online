import { Check, Pause, Pencil, Play, Receipt, Repeat, RotateCcw, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Badge, Button, Card, Container, Eyebrow, Heading, Icon, Text } from "@/components/ui";
import { getBillCategoryLabel } from "@/components/home-planner/bill-category-options";
import { BillStatusBadge } from "@/components/home-planner/bill-status-badge";
import { getBillById } from "@/lib/home-planner/bills";
import { calculateBillStatus } from "@/lib/home-planner/bill-status";
import { formatMoney } from "@/lib/home-planner/format-currency";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getRecurrenceFrequencyLabel, previewUpcomingOccurrences } from "@/lib/home-planner/recurrence";

import { deleteBillAction, markPaidAction, markUnpaidAction, setBillRecurrenceActiveAction } from "../actions";

interface BillDetailPageProps {
  params: Promise<{ billId: string }>;
}

export const metadata: Metadata = {
  title: "Bill Details",
  robots: { index: false, follow: false },
};

/** Bill details - the same shape `TaskDetailPage` (Maintenance) establishes. */
export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { billId } = await params;
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const bill = await getBillById(home.id, billId);

  if (!bill) {
    notFound();
  }

  const status = calculateBillStatus(bill, new Date());
  const isPaid = status === "paid";

  const toggleAction = isPaid ? markUnpaidAction.bind(null, bill.id) : markPaidAction.bind(null, bill.id);
  const deleteAction = deleteBillAction.bind(null, bill.id);
  const toggleRecurrenceAction = setBillRecurrenceActiveAction.bind(null, bill.id, !bill.recurrenceActive);

  const upcomingPreview = bill.recurrenceFrequency
    ? previewUpcomingOccurrences(bill.dueDate ?? new Date().toISOString().slice(0, 10), bill.recurrenceFrequency, bill.recurrenceIntervalDays)
    : [];

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
            <Icon icon={Receipt} size="md" />
          </div>
          <div>
            <Eyebrow tone="brand">Home Planner</Eyebrow>
            <Heading as="h1" size="h2" className="mt-2">
              {bill.name}
            </Heading>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BillStatusBadge status={status} />
              <Badge variant="neutral">{getBillCategoryLabel(bill.category)}</Badge>
              <Badge variant="neutral">{formatMoney(bill.amountCents)}</Badge>
              {bill.recurrenceFrequency && (
                <Badge variant="brand">
                  <Icon icon={Repeat} size="sm" />
                  {getRecurrenceFrequencyLabel(bill.recurrenceFrequency)}
                  {!bill.recurrenceActive && " (paused)"}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button href={`/app/home-planner/bills/${bill.id}/edit`} variant="outline" leadingIcon={<Icon icon={Pencil} size="sm" />}>
            Edit
          </Button>
          <form action={deleteAction}>
            <Button type="submit" variant="outline" leadingIcon={<Icon icon={Trash2} size="sm" />}>
              Delete
            </Button>
          </form>
        </div>
      </div>

      <form action={toggleAction}>
        <Button type="submit" leadingIcon={<Icon icon={isPaid ? RotateCcw : Check} size="sm" />}>
          {isPaid ? "Mark unpaid" : "Mark paid"}
        </Button>
      </form>

      <Card variant="standard" padding="lg" className="flex flex-col gap-5">
        <div>
          <Text size="body-sm" tone="muted">
            Due date
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {bill.dueDate ?? "Not set"}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Notes
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {bill.notes || "Nothing added yet"}
          </Text>
        </div>
      </Card>

      {bill.recurrenceFrequency && (
        <Card variant="standard" padding="lg" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text size="body" weight="medium" className="text-ink">
              Recurs {getRecurrenceFrequencyLabel(bill.recurrenceFrequency).toLowerCase()}
            </Text>
            <form action={toggleRecurrenceAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                leadingIcon={<Icon icon={bill.recurrenceActive ? Pause : Play} size="sm" />}
              >
                {bill.recurrenceActive ? "Pause recurrence" : "Resume recurrence"}
              </Button>
            </form>
          </div>
          {!bill.recurrenceActive && (
            <Text size="body-sm" tone="muted">
              Recurrence is paused - marking this bill paid won&rsquo;t create a next occurrence.
            </Text>
          )}
          {upcomingPreview.length > 0 && (
            <div>
              <Text size="body-sm" tone="muted">
                Upcoming occurrences (estimated)
              </Text>
              <ul className="mt-1 flex flex-col gap-0.5">
                {upcomingPreview.map((date) => (
                  <Text key={date} as="li" size="body-sm" className="text-ink">
                    {date}
                  </Text>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <Button href="/app/home-planner/bills" variant="ghost" className="self-start">
        Back to bills
      </Button>
    </Container>
  );
}

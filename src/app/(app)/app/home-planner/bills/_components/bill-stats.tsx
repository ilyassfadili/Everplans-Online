import { Card, Heading, Text } from "@/components/ui";
import { formatMoney } from "@/lib/home-planner/format-currency";

import type { BillWithStatus } from "./bill-list";

interface BillStatsProps {
  items: BillWithStatus[];
}

/** The Bills overview's own indicators - counts plus a total for what's currently due or overdue, derived from the same list the page already fetched. */
export function BillStats({ items }: BillStatsProps) {
  const dueSoonCount = items.filter((item) => item.status === "due").length;
  const overdueCount = items.filter((item) => item.status === "overdue").length;
  const paidCount = items.filter((item) => item.status === "paid").length;
  const outstandingCents = items
    .filter((item) => item.status === "due" || item.status === "overdue")
    .reduce((sum, item) => sum + item.bill.amountCents, 0);

  const stats = [
    { label: "Due soon", value: String(dueSoonCount) },
    { label: "Overdue", value: String(overdueCount) },
    { label: "Paid", value: String(paidCount) },
    { label: "Due + overdue total", value: formatMoney(outstandingCents) },
  ];

  return (
    <Card variant="standard" padding="lg">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <Text size="body-sm" tone="muted">
              {stat.label}
            </Text>
            <Heading as="h2" size="h3">
              {stat.value}
            </Heading>
          </div>
        ))}
      </div>
    </Card>
  );
}
